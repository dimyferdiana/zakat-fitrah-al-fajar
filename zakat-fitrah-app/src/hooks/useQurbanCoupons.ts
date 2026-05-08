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
    queryKey: [COUPONS_QUERY_KEY, eventId, recipientType, status, page],
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

      // Find mustahik who already have a coupon for this event to skip them
      const { data: existing } = await supabase
        .from('qurban_coupons')
        .select('recipient_id')
        .eq('event_id', eventId)
        .eq('recipient_type', 'mustahik')
        .in('recipient_id', mustahikIds)

      const existingIds = new Set((existing || []).map((r) => r.recipient_id))
      const newIds = mustahikIds.filter((id) => !existingIds.has(id))

      if (newIds.length === 0) return []

      const rows = newIds.map((mustahikId) => ({
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
    onError: (_err: Error) => {
      // Caller handles error message display — don't auto-toast here
    },
  })
}

// ---- Redeem manually by coupon id ----
export function useRedeemCouponManually() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ couponId, eventId: _eventId }: { couponId: string; eventId: string }) => {
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
    mutationFn: async ({ couponId, eventId: _eventId }: { couponId: string; eventId: string }) => {
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

// ---- Update expiry ----
export function useUpdateCouponExpiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      couponIds,
      eventId: _eventId,
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
