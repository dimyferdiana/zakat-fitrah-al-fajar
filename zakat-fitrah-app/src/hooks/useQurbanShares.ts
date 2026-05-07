import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { QurbanShareWithMuzakki } from '@/types/qurban'
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
