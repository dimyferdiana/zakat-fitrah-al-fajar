import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { QurbanShareWithMuzakki, QurbanShareFlat, QurbanShareListParams } from '@/types/qurban'
import { getMaxSlots } from '@/types/qurban'

export interface MuzakkiMaster {
  id: string
  nama_kk: string
  alamat: string
  no_telp: string | null
}

export function useQurbanShareList(animalId: string | null) {
  return useQuery({
    queryKey: ['qurban-shares', animalId],
    queryFn: async (): Promise<QurbanShareWithMuzakki[]> => {
      if (!animalId) return []

      const { data, error } = await supabase
        .from('qurban_shares')
        .select('*, muzakki(id, nama_kk, no_telp)')
        .eq('animal_id', animalId)
        .order('urutan', { ascending: true })

      if (error) throw error
      return (data || []) as unknown as QurbanShareWithMuzakki[]
    },
    enabled: !!animalId,
  })
}

interface AssignQurbanShareInput {
  animal_id: string
  muzakki_id: string
  urutan: number
  nominal: number
  catatan?: string
}

export function useAssignQurbanShare() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AssignQurbanShareInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // App-level slot check
      const { data: animal, error: animalError } = await supabase
        .from('qurban_animals')
        .select('jenis')
        .eq('id', input.animal_id)
        .single()

      if (animalError) throw animalError

      const maxSlots = getMaxSlots(animal.jenis as 'sapi' | 'kambing')

      const { count, error: countError } = await supabase
        .from('qurban_shares')
        .select('id', { count: 'exact', head: true })
        .eq('animal_id', input.animal_id)

      if (countError) throw countError

      if ((count || 0) >= maxSlots) {
        throw new Error('Slot sudah penuh')
      }

      const { data, error } = await supabase
        .from('qurban_shares')
        .insert({
          animal_id: input.animal_id,
          muzakki_id: input.muzakki_id,
          urutan: input.urutan,
          nominal: input.nominal,
          catatan: input.catatan ?? null,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['qurban-shares', variables.animal_id] })
      toast.success('Peserta qurban berhasil ditambahkan')
    },
    onError: (error: Error) => {
      toast.error(`Gagal menambahkan peserta qurban: ${error.message}`)
    },
  })
}

interface UpdateSharePaymentInput {
  id: string
  animal_id: string
  status_pembayaran: 'belum_bayar' | 'lunas'
}

export function useUpdateSharePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateSharePaymentInput) => {
      const { data, error } = await supabase
        .from('qurban_shares')
        .update({ status_pembayaran: input.status_pembayaran })
        .eq('id', input.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['qurban-shares', variables.animal_id] })
      const previousData = queryClient.getQueryData<QurbanShareWithMuzakki[]>(['qurban-shares', variables.animal_id])
      if (previousData) {
        queryClient.setQueryData(
          ['qurban-shares', variables.animal_id],
          previousData.map((share) =>
            share.id === variables.id
              ? { ...share, status_pembayaran: variables.status_pembayaran }
              : share
          )
        )
      }
      return { previousData }
    },
    onSuccess: (_data, variables) => {
      const label = variables.status_pembayaran === 'lunas' ? 'Lunas' : 'Belum Bayar'
      toast.success(`Status pembayaran diperbarui menjadi ${label}`)
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['qurban-shares', variables.animal_id], context.previousData)
      }
      toast.error(`Gagal memperbarui status pembayaran: ${error.message}`)
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['qurban-shares', variables.animal_id] })
    },
  })
}

interface RemoveQurbanShareInput {
  id: string
  animal_id: string
}

export function useRemoveQurbanShare() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RemoveQurbanShareInput) => {
      const { error } = await supabase
        .from('qurban_shares')
        .delete()
        .eq('id', input.id)

      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['qurban-shares', variables.animal_id] })
      toast.success('Peserta qurban berhasil dihapus')
    },
    onError: (error: Error) => {
      toast.error(`Gagal menghapus peserta qurban: ${error.message}`)
    },
  })
}

export function useMuzakkiSearch(query: string) {
  return useQuery({
    queryKey: ['muzakki-search', query],
    queryFn: async (): Promise<MuzakkiMaster[]> => {
      if (query.length < 2) return []

      const { data, error } = await supabase
        .from('muzakki')
        .select('id, nama_kk, alamat, no_telp')
        .ilike('nama_kk', `%${query}%`)
        .limit(20)

      if (error) throw error
      return (data || []) as MuzakkiMaster[]
    },
    enabled: query.length >= 2,
  })
}

// ---- Available animal slots (for AddPesertaDialog) ----

export interface AvailableAnimalSlot {
  id: string
  nomor: string
  jenis: 'sapi' | 'kambing'
  event_id: string
  sisa_slot: number
}

export function useAvailableAnimalSlots(eventId?: string) {
  return useQuery({
    queryKey: ['qurban_available_slots', eventId],
    queryFn: async (): Promise<AvailableAnimalSlot[]> => {
      let query = supabase
        .from('qurban_animals')
        .select('id, nomor, jenis, event_id, qurban_shares(count)')

      if (eventId) {
        query = query.eq('event_id', eventId)
      }

      const { data, error } = await query

      if (error) throw error

      const slots: AvailableAnimalSlot[] = (data || [])
        .map((animal: any) => {
          const maxSlots = getMaxSlots(animal.jenis as 'sapi' | 'kambing')
          const assignedCount = animal.qurban_shares?.[0]?.count ?? 0
          return {
            id: animal.id,
            nomor: animal.nomor,
            jenis: animal.jenis as 'sapi' | 'kambing',
            event_id: animal.event_id,
            sisa_slot: maxSlots - assignedCount,
          }
        })
        .filter((slot) => slot.sisa_slot > 0)

      return slots
    },
  })
}

// ---- Flat list for Daftar Peserta page ----
export function useQurbanShareListFlat(params: QurbanShareListParams) {
  const { eventId, status, search, page = 1, pageSize = 20 } = params

  return useQuery({
    queryKey: ['qurban-shares-flat', eventId, status, search, page],
    queryFn: async (): Promise<{ data: QurbanShareFlat[]; count: number }> => {
      let query = supabase
        .from('qurban_shares')
        .select(`
          id, animal_id, urutan, nominal, status_pembayaran, catatan, created_at, muzakki_id,
          muzakki!inner(id, nama_kk, no_telp),
          qurban_animals!inner(id, nomor, jenis, event_id,
            qurban_events!inner(id, nama, tanggal)
          ),
          qurban_coupons(id, status, coupon_number, token, expires_at, redeemed_at)
        `, { count: 'exact' })

      if (eventId) {
        query = query.eq('qurban_animals.event_id', eventId)
      }
      if (status && status !== 'all') {
        query = query.eq('status_pembayaran', status)
      }
      if (search) {
        query = query.ilike('muzakki.nama_kk', `%${search}%`)
      }

      query = query
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      const { data, error, count } = await query
      if (error) throw error

      const flat: QurbanShareFlat[] = (data || []).map((row: any) => ({
        id: row.id,
        animal_id: row.animal_id,
        urutan: row.urutan,
        nominal: row.nominal,
        status_pembayaran: row.status_pembayaran,
        catatan: row.catatan,
        created_at: row.created_at,
        muzakki_id: row.muzakki_id,
        muzakki_nama: row.muzakki?.nama_kk ?? '',
        muzakki_no_telp: row.muzakki?.no_telp ?? null,
        animal_nomor: row.qurban_animals?.nomor ?? '',
        animal_jenis: row.qurban_animals?.jenis ?? 'sapi',
        event_id: row.qurban_animals?.event_id ?? '',
        event_nama: row.qurban_animals?.qurban_events?.nama ?? '',
        event_tanggal: row.qurban_animals?.qurban_events?.tanggal ?? '',
        coupon: row.qurban_coupons?.[0] ?? null,
      }))

      return { data: flat, count: count ?? 0 }
    },
  })
}
