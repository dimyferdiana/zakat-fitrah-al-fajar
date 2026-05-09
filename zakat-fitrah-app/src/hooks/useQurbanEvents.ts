import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { QurbanEvent } from '@/types/qurban'

export function useQurbanEventList() {
  return useQuery({
    queryKey: ['qurban-events'],
    queryFn: async (): Promise<QurbanEvent[]> => {
      const { data, error } = await supabase
        .from('qurban_events')
        .select('*')
        .order('tanggal', { ascending: false })

      if (error) throw error
      return (data || []) as QurbanEvent[]
    },
  })
}

interface CreateQurbanEventInput {
  nama: string
  tanggal: string
  catatan?: string
}

interface UpdateQurbanEventInput {
  id: string
  nama: string
  tanggal: string
  catatan?: string
}

export function useCreateQurbanEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateQurbanEventInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('qurban_events')
        .insert({
          nama: input.nama,
          tanggal: input.tanggal,
          catatan: input.catatan ?? null,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data as QurbanEvent
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qurban-events'] })
      toast.success('Event qurban berhasil dibuat')
    },
    onError: (error: Error) => {
      toast.error(`Gagal membuat event qurban: ${error.message}`)
    },
  })
}

export function useUpdateQurbanEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateQurbanEventInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('qurban_events')
        .update({
          nama: input.nama,
          tanggal: input.tanggal,
          catatan: input.catatan ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single()

      if (error) throw error
      return data as QurbanEvent
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qurban-events'] })
      toast.success('Event qurban berhasil diperbarui')
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui event qurban: ${error.message}`)
    },
  })
}

export function useDeleteQurbanEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Check if any animals exist for this event
      const { count, error: countError } = await supabase
        .from('qurban_animals')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', id)

      if (countError) throw countError

      if ((count || 0) > 0) {
        throw new Error('Tidak bisa menghapus event yang masih memiliki hewan qurban')
      }

      const { error } = await supabase
        .from('qurban_events')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qurban-events'] })
      toast.success('Event qurban berhasil dihapus')
    },
    onError: (error: Error) => {
      toast.error(`Gagal menghapus event qurban: ${error.message}`)
    },
  })
}
