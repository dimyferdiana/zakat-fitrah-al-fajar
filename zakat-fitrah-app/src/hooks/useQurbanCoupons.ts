import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { QurbanCoupon, QurbanCouponWithRecipient, QurbanCouponListParams } from '@/types/qurban'

const COUPONS_QUERY_KEY = 'qurban-coupons'

// ---- List query ----
export function useQurbanCouponsByEvent(
  eventId: string | null,
  params: Omit<QurbanCouponListParams, 'eventId'> = {}
) {
  const { recipientType, status, page = 1, pageSize = 20 } = params

  return useQuery({
    queryKey: [COUPONS_QUERY_KEY, eventId, recipientType, status, page, pageSize],
    queryFn: async () => {
      if (!eventId) return { data: [], count: 0 }

      let query = supabase
        .from('qurban_coupons')
        .select(`
          *,
          qurban_event:qurban_events(id, nama, tanggal),
          qurban_share:qurban_shares(id, urutan, nominal,
            qurban_animal:qurban_animals(id, nomor, jenis)
          )
        `, { count: 'exact' })
        .eq('event_id', eventId)

      if (recipientType) query = query.eq('recipient_type', recipientType)
      if (status && status !== 'all') query = query.eq('status', status)
      // For search we do a separate lookup — handled in the component layer
      query = query
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      const { data, error, count } = await query
      if (error) throw error
      return { data: (data || []) as QurbanCouponWithRecipient[], count: count ?? 0 }
    },
    enabled: !!eventId,
  })
}

// Look up a coupon by token (for scan validation — read only, no mutation yet)
export function useCouponByToken(token: string | null) {
  return useQuery({
    queryKey: [COUPONS_QUERY_KEY, 'token', token],
    queryFn: async () => {
      if (!token) return null
      const { data, error } = await supabase
        .from('qurban_coupons')
        .select(`
          *,
          qurban_event:qurban_events(id, nama, tanggal),
          qurban_share:qurban_shares(id, urutan, nominal,
            qurban_animal:qurban_animals(id, nomor, jenis)
          )
        `)
        .eq('token', token)
        .maybeSingle()
      if (error) throw error
      return data as QurbanCouponWithRecipient | null
    },
    enabled: !!token,
  })
}

// ---- Generate muzakki coupon ----
export function useGenerateMuzakkiCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      shareId,
      eventId,
      muzakkiId,
      expiresAt,
    }: {
      shareId: string
      eventId: string
      muzakkiId: string
      expiresAt: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Cancel existing coupon for this share if any
      await supabase
        .from('qurban_coupons')
        .update({ status: 'cancelled' })
        .eq('qurban_share_id', shareId)
        .eq('status', 'active')

      const { data, error } = await supabase
        .from('qurban_coupons')
        .insert({
          event_id: eventId,
          recipient_type: 'muzakki',
          recipient_id: muzakkiId,
          qurban_share_id: shareId,
          expires_at: expiresAt,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data as QurbanCoupon
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [COUPONS_QUERY_KEY, variables.eventId] })
      toast.success('Kupon berhasil dibuat')
    },
    onError: (err: Error) => toast.error(`Gagal membuat kupon: ${err.message}`),
  })
}

// ---- Bulk generate mustahik coupons ----
export function useGenerateMustahikCoupons() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      eventId,
      mustahikIds,
      expiresAt,
    }: {
      eventId: string
      mustahikIds: string[]
      expiresAt: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (mustahikIds.length === 0) return []

      // All selected IDs receive a coupon — duplicates are allowed (unique index was dropped)
      const rows = mustahikIds.map((mustahikId) => ({
        event_id: eventId,
        recipient_type: 'mustahik' as const,
        recipient_id: mustahikId,
        expires_at: expiresAt,
        created_by: user.id,
      }))

      const { data, error } = await supabase
        .from('qurban_coupons')
        .insert(rows)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [COUPONS_QUERY_KEY, variables.eventId] })
      toast.success('Kupon berhasil dibuat untuk semua mustahik yang dipilih')
    },
    onError: (err: Error) => toast.error(`Gagal membuat kupon: ${err.message}`),
  })
}

// ---- Redeem by token ----
export function useRedeemCouponByToken() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      token,
      expectedEventId,
    }: {
      token: string
      expectedEventId: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Fetch coupon
      const { data: coupon, error: fetchErr } = await supabase
        .from('qurban_coupons')
        .select('*')
        .eq('token', token)
        .maybeSingle()
      if (fetchErr) throw fetchErr
      if (!coupon) throw new Error('NOT_FOUND')

      if (coupon.status === 'redeemed') throw new Error('ALREADY_REDEEMED:' + coupon.redeemed_at)
      if (coupon.status === 'cancelled') throw new Error('CANCELLED')
      if (new Date(coupon.expires_at) < new Date()) throw new Error('EXPIRED')
      if (coupon.event_id !== expectedEventId) throw new Error('WRONG_EVENT')

      const { data, error } = await supabase
        .from('qurban_coupons')
        .update({ status: 'redeemed', redeemed_at: new Date().toISOString(), redeemed_by: user.id })
        .eq('id', coupon.id)
        .select()
        .single()
      if (error) throw error
      return data as QurbanCoupon
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [COUPONS_QUERY_KEY, variables.expectedEventId] })
    },
    onError: () => {
      // Caller handles error message display — don't auto-toast here
    },
  })
}

// ---- Redeem manually by coupon id ----
export function useRedeemCouponManually() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ couponId }: { couponId: string; eventId: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: coupon, error: fetchErr } = await supabase
        .from('qurban_coupons')
        .select('*')
        .eq('id', couponId)
        .single()
      if (fetchErr) throw fetchErr
      if (coupon.status !== 'active') throw new Error('Kupon sudah tidak aktif')
      if (new Date(coupon.expires_at) < new Date()) throw new Error('Kupon sudah kedaluwarsa')

      const { data, error } = await supabase
        .from('qurban_coupons')
        .update({ status: 'redeemed', redeemed_at: new Date().toISOString(), redeemed_by: user.id })
        .eq('id', couponId)
        .select()
        .single()
      if (error) throw error
      return data as QurbanCoupon
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [COUPONS_QUERY_KEY, variables.eventId] })
      toast.success('Kupon berhasil ditebus')
    },
    onError: (err: Error) => toast.error(`Gagal menebus kupon: ${err.message}`),
  })
}

// ---- Cancel coupon ----
export function useCancelCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ couponId }: { couponId: string; eventId: string }) => {
      const { data, error } = await supabase
        .from('qurban_coupons')
        .update({ status: 'cancelled' })
        .eq('id', couponId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [COUPONS_QUERY_KEY, variables.eventId] })
      toast.success('Kupon berhasil dibatalkan')
    },
    onError: (err: Error) => toast.error(`Gagal membatalkan kupon: ${err.message}`),
  })
}

// ---- Count-only queries (for progress stats without pagination interference) ----
export function useQurbanCouponCounts(eventId: string | null, recipientType: 'mustahik' | 'muzakki') {
  return useQuery({
    queryKey: [COUPONS_QUERY_KEY, eventId, 'counts', recipientType],
    queryFn: async () => {
      if (!eventId) return { total: 0, redeemed: 0, active: 0 }

      const [totalRes, redeemedRes, activeRes] = await Promise.all([
        supabase
          .from('qurban_coupons')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId)
          .eq('recipient_type', recipientType),
        supabase
          .from('qurban_coupons')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId)
          .eq('recipient_type', recipientType)
          .eq('status', 'redeemed'),
        supabase
          .from('qurban_coupons')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId)
          .eq('recipient_type', recipientType)
          .eq('status', 'active'),
      ])

      return {
        total: totalRes.count ?? 0,
        redeemed: redeemedRes.count ?? 0,
        active: activeRes.count ?? 0,
      }
    },
    enabled: !!eventId,
  })
}

// ---- Fetch distribution coupons for a single muzakki ----
export function useMuzakkiDistributionCoupons(eventId: string | null, muzakkiId: string | null) {
  return useQuery({
    queryKey: [COUPONS_QUERY_KEY, eventId, 'muzakki-distribution', muzakkiId],
    queryFn: async () => {
      if (!eventId || !muzakkiId) return []
      const { data, error } = await supabase
        .from('qurban_coupons')
        .select('*')
        .eq('event_id', eventId)
        .eq('recipient_type', 'muzakki')
        .eq('recipient_id', muzakkiId)
        .is('qurban_share_id', null)
        .in('status', ['active', 'redeemed'])
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data || []) as QurbanCoupon[]
    },
    enabled: !!eventId && !!muzakkiId,
  })
}

// ---- Muzakki distribution status (for pengurban panel) ----
// Target counts: sapi pengurban = 5, kambing-only = 3
const SAPI_TARGET = 5
const KAMBING_TARGET = 3

export interface MuzakkiDistributionStatus {
  muzakki_id: string
  nama_kk: string
  no_telp: string | null
  hasSapi: boolean
  hasKambing: boolean
  targetCount: number
  currentCount: number
  deficit: number
}

export function useQurbanMuzakkiDistributionStatus(eventId: string | null) {
  return useQuery({
    queryKey: ['qurban-muzakki-distribution-status', eventId],
    queryFn: async (): Promise<MuzakkiDistributionStatus[]> => {
      if (!eventId) return []

      // 1. Get all animals for this event with their shares and muzakki
      const { data: animals, error: animalsError } = await supabase
        .from('qurban_animals')
        .select(`
          id,
          jenis,
          qurban_shares(
            muzakki_id,
            muzakki(id, nama_kk, no_telp)
          )
        `)
        .eq('event_id', eventId)

      if (animalsError) throw animalsError

      // 2. Get existing distribution coupons (share_id IS NULL = distribution, not ownership)
      const { data: coupons, error: couponsError } = await supabase
        .from('qurban_coupons')
        .select('recipient_id')
        .eq('event_id', eventId)
        .eq('recipient_type', 'muzakki')
        .is('qurban_share_id', null)
        .in('status', ['active', 'redeemed'])

      if (couponsError) throw couponsError

      // 3. Build coupon count map
      const couponCountMap = new Map<string, number>()
      for (const c of coupons ?? []) {
        couponCountMap.set(c.recipient_id, (couponCountMap.get(c.recipient_id) ?? 0) + 1)
      }

      // 4. Aggregate per muzakki
      const muzakkiMap = new Map<string, MuzakkiDistributionStatus>()
      for (const animal of animals ?? []) {
        const jenis = animal.jenis as 'sapi' | 'kambing'
        for (const share of (animal.qurban_shares) ?? []) {
          const muzakkiId = share.muzakki_id as string
          const m = share.muzakki as { id: string; nama_kk: string; no_telp: string | null } | null
          if (!muzakkiMap.has(muzakkiId)) {
            muzakkiMap.set(muzakkiId, {
              muzakki_id: muzakkiId,
              nama_kk: m?.nama_kk ?? '—',
              no_telp: m?.no_telp ?? null,
              hasSapi: false,
              hasKambing: false,
              targetCount: 0,
              currentCount: couponCountMap.get(muzakkiId) ?? 0,
              deficit: 0,
            })
          }
          const entry = muzakkiMap.get(muzakkiId)!
          if (jenis === 'sapi') entry.hasSapi = true
          if (jenis === 'kambing') entry.hasKambing = true
        }
      }

      // 5. Calculate targets and deficits
      return Array.from(muzakkiMap.values()).map((entry) => {
        const target = entry.hasSapi ? SAPI_TARGET : KAMBING_TARGET
        return {
          ...entry,
          targetCount: target,
          deficit: Math.max(0, target - entry.currentCount),
        }
      }).sort((a, b) => a.nama_kk.localeCompare(b.nama_kk))
    },
    enabled: !!eventId,
  })
}

// ---- Generate pengurban distribution coupons ----
export function useGeneratePengurbanDistributionCoupons() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      eventId,
      items,
      expiresAt,
    }: {
      eventId: string
      items: { muzakkiId: string; count: number }[]
      expiresAt: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const itemsWithCoupons = items.filter((i) => i.count > 0)
      if (itemsWithCoupons.length === 0) return []

      const rows = itemsWithCoupons.flatMap(({ muzakkiId, count }) =>
        Array.from({ length: count }).map(() => ({
          event_id: eventId,
          recipient_type: 'muzakki' as const,
          recipient_id: muzakkiId,
          qurban_share_id: null,
          expires_at: expiresAt,
          created_by: user.id,
        }))
      )

      const { data, error } = await supabase
        .from('qurban_coupons')
        .insert(rows)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [COUPONS_QUERY_KEY, variables.eventId] })
      queryClient.invalidateQueries({ queryKey: ['qurban-muzakki-distribution-status', variables.eventId] })
      toast.success('Kupon pengurban berhasil dibuat')
    },
    onError: (err: Error) => toast.error(`Gagal membuat kupon: ${err.message}`),
  })
}

// ---- Fetch all distribution coupons for given muzakki IDs (imperative, for bulk download) ----
export async function fetchMuzakkiDistributionCouponsForIds(
  eventId: string,
  muzakkiIds: string[]
): Promise<QurbanCoupon[]> {
  if (muzakkiIds.length === 0) return []
  const { data, error } = await supabase
    .from('qurban_coupons')
    .select('*')
    .eq('event_id', eventId)
    .eq('recipient_type', 'muzakki')
    .is('qurban_share_id', null)
    .in('status', ['active', 'redeemed'])
    .in('recipient_id', muzakkiIds)
    .order('recipient_id', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []) as QurbanCoupon[]
}

// ---- Update expiry ----
export function useUpdateCouponExpiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      couponIds,
      expiresAt,
    }: {
      couponIds: string[]
      eventId: string
      expiresAt: string
    }) => {
      const { error } = await supabase
        .from('qurban_coupons')
        .update({ expires_at: expiresAt })
        .in('id', couponIds)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [COUPONS_QUERY_KEY, variables.eventId] })
      toast.success('Tanggal berlaku kupon berhasil diperbarui')
    },
    onError: (err: Error) => toast.error(`Gagal memperbarui expiry: ${err.message}`),
  })
}
