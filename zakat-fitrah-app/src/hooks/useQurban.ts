import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type {
  QurbanRegistrationWithParticipants,
  QurbanListParams,
} from '@/types/qurban'

export function useQurbanList(params: QurbanListParams) {
  return useQuery({
    queryKey: ['qurban', params],
    queryFn: async (): Promise<{
      data: QurbanRegistrationWithParticipants[]
      count: number
    }> => {
      let query = supabase
        .from('qurban_registrations')
        .select('*, qurban_participants(*)', { count: 'exact' })

      if (params.search) {
        query = query.or(
          `nama.ilike.%${params.search}%,no_hp.ilike.%${params.search}%`
        )
      }

      if (params.jenis && params.jenis !== 'all') {
        query = query.eq('jenis', params.jenis)
      }

      if (params.status && params.status !== 'all') {
        query = query.eq('status', params.status)
      }

      if (params.dateFrom) {
        query = query.gte('tanggal', params.dateFrom)
      }

      if (params.dateTo) {
        query = query.lte('tanggal', params.dateTo)
      }

      query = query.order('tanggal', { ascending: false })

      const page = params.page || 1
      const pageSize = params.pageSize || 20
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      // Sort participants by urutan within each registration
      const dataWithSortedParticipants = (data || []).map((reg) => ({
        ...reg,
        qurban_participants: (reg.qurban_participants || []).sort(
          (a: { urutan: number }, b: { urutan: number }) => a.urutan - b.urutan
        ),
      }))

      return {
        data: dataWithSortedParticipants as QurbanRegistrationWithParticipants[],
        count: count || 0,
      }
    },
  })
}

interface CreateQurbanInput {
  tanggal: string
  nama: string
  alamat: string
  no_hp: string
  jenis: 'sapi' | 'kambing'
  sumber_hewan: 'beli' | 'titipan'
  biaya_perawatan?: number | null
  participants: { nama: string }[]
  nominal: number
  status: 'terdaftar' | 'lunas'
  catatan?: string
}

interface UpdateQurbanInput extends CreateQurbanInput {
  id: string
}

export function useCreateQurban() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateQurbanInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: registration, error: regError } = await supabase
        .from('qurban_registrations')
        .insert({
          no_qurban: '',
          tanggal: input.tanggal,
          nama: input.nama,
          alamat: input.alamat,
          no_hp: input.no_hp,
          jenis: input.jenis,
          sumber_hewan: input.sumber_hewan,
          biaya_perawatan: input.biaya_perawatan ?? null,
          nominal: input.nominal,
          status: input.status,
          catatan: input.catatan ?? null,
          created_by: user.id,
        })
        .select()
        .single()

      if (regError) throw regError

      const participants = input.participants.map((p, i) => ({
        qurban_registration_id: registration.id,
        nama: p.nama,
        urutan: i + 1,
      }))

      if (participants.length > 0) {
        const { error: partError } = await supabase
          .from('qurban_participants')
          .insert(participants)

        if (partError) throw partError
      }

      return registration
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qurban'] })
      toast.success('Pendaftaran qurban berhasil ditambahkan')
    },
    onError: (error: Error) => {
      toast.error(`Gagal menambahkan pendaftaran: ${error.message}`)
    },
  })
}

export function useUpdateQurban() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateQurbanInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: registration, error: regError } = await supabase
        .from('qurban_registrations')
        .update({
          tanggal: input.tanggal,
          nama: input.nama,
          alamat: input.alamat,
          no_hp: input.no_hp,
          jenis: input.jenis,
          sumber_hewan: input.sumber_hewan,
          biaya_perawatan: input.biaya_perawatan ?? null,
          nominal: input.nominal,
          status: input.status,
          catatan: input.catatan ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single()

      if (regError) throw regError

      // Delete old participants
      const { error: deleteError } = await supabase
        .from('qurban_participants')
        .delete()
        .eq('qurban_registration_id', input.id)

      if (deleteError) throw deleteError

      // Insert new participants
      const participants = input.participants.map((p, i) => ({
        qurban_registration_id: input.id,
        nama: p.nama,
        urutan: i + 1,
      }))

      if (participants.length > 0) {
        const { error: partError } = await supabase
          .from('qurban_participants')
          .insert(participants)

        if (partError) throw partError
      }

      return registration
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qurban'] })
      toast.success('Data pendaftaran qurban berhasil diperbarui')
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui pendaftaran: ${error.message}`)
    },
  })
}

export function useDeleteQurban() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('qurban_registrations')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qurban'] })
      toast.success('Data pendaftaran qurban berhasil dihapus')
    },
    onError: (error: Error) => {
      toast.error(`Gagal menghapus pendaftaran: ${error.message}`)
    },
  })
}

export function useQurbanDetail(id: string) {
  return useQuery({
    queryKey: ['qurban-detail', id],
    queryFn: async (): Promise<QurbanRegistrationWithParticipants | null> => {
      if (!id) return null

      const { data, error } = await supabase
        .from('qurban_registrations')
        .select('*, qurban_participants(*)')
        .eq('id', id)
        .single()

      if (error) throw error

      return {
        ...data,
        qurban_participants: (data.qurban_participants || []).sort(
          (a: { urutan: number }, b: { urutan: number }) => a.urutan - b.urutan
        ),
      } as QurbanRegistrationWithParticipants
    },
    enabled: !!id,
  })
}
