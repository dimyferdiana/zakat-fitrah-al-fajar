import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { QurbanAnimal } from '@/types/qurban'

export function useQurbanAnimalList(eventId: string | null) {
  return useQuery({
    queryKey: ['qurban-animals', eventId],
    queryFn: async (): Promise<QurbanAnimal[]> => {
      if (!eventId) return []

      const { data, error } = await supabase
        .from('qurban_animals')
        .select('*')
        .eq('event_id', eventId)
        .order('nomor', { ascending: true })

      if (error) throw error
      return (data || []) as QurbanAnimal[]
    },
    enabled: !!eventId,
  })
}

export function useQurbanAnimalDetail(animalId: string | null) {
  return useQuery({
    queryKey: ['qurban-animal-detail', animalId],
    queryFn: async (): Promise<QurbanAnimal | null> => {
      if (!animalId) return null

      const { data, error } = await supabase
        .from('qurban_animals')
        .select('*')
        .eq('id', animalId)
        .single()

      if (error) throw error
      return data as QurbanAnimal
    },
    enabled: !!animalId,
  })
}

interface CreateQurbanAnimalInput {
  event_id: string
  jenis: 'sapi' | 'kambing'
  sumber_hewan: 'beli' | 'titipan' | 'al_fajar'
  nomor: string
  berat_kg?: number | null
  harga: number
  biaya_perawatan?: number | null
  catatan?: string | null
  foto?: File | null
}

interface UpdateQurbanAnimalInput extends Omit<CreateQurbanAnimalInput, 'event_id'> {
  id: string
  event_id: string
  foto_url?: string | null
}

async function uploadAnimalPhoto(userId: string, file: File): Promise<string> {
  const path = `${userId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('qurban-photos')
    .upload(path, file, { upsert: false })

  if (uploadError) throw uploadError

  const { data } = supabase.storage
    .from('qurban-photos')
    .getPublicUrl(path)

  return data.publicUrl
}

async function deleteAnimalPhoto(fotoUrl: string): Promise<void> {
  // Extract the path from the public URL
  // URL format: .../storage/v1/object/public/qurban-photos/<path>
  const marker = '/qurban-photos/'
  const idx = fotoUrl.indexOf(marker)
  if (idx === -1) return

  const path = fotoUrl.slice(idx + marker.length)
  await supabase.storage.from('qurban-photos').remove([path])
}

export function useCreateQurbanAnimal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateQurbanAnimalInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      let foto_url: string | null = null

      if (input.foto) {
        foto_url = await uploadAnimalPhoto(user.id, input.foto)
      }

      const { data, error } = await supabase
        .from('qurban_animals')
        .insert({
          event_id: input.event_id,
          jenis: input.jenis,
          sumber_hewan: input.sumber_hewan,
          nomor: input.nomor,
          berat_kg: input.berat_kg ?? null,
          harga: input.harga,
          biaya_perawatan: input.biaya_perawatan ?? null,
          catatan: input.catatan ?? null,
          foto_url,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data as QurbanAnimal
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['qurban-animals', variables.event_id] })
      toast.success('Hewan qurban berhasil ditambahkan')
    },
    onError: (error: Error) => {
      toast.error(`Gagal menambahkan hewan qurban: ${error.message}`)
    },
  })
}

export function useUpdateQurbanAnimal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateQurbanAnimalInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      let foto_url: string | null = input.foto_url ?? null

      if (input.foto) {
        // Upload new photo
        foto_url = await uploadAnimalPhoto(user.id, input.foto)
      }

      const { data, error } = await supabase
        .from('qurban_animals')
        .update({
          jenis: input.jenis,
          sumber_hewan: input.sumber_hewan,
          nomor: input.nomor,
          berat_kg: input.berat_kg ?? null,
          harga: input.harga,
          biaya_perawatan: input.biaya_perawatan ?? null,
          catatan: input.catatan ?? null,
          foto_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single()

      if (error) throw error
      return data as QurbanAnimal
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['qurban-animals', variables.event_id] })
      queryClient.invalidateQueries({ queryKey: ['qurban-animal-detail', variables.id] })
      toast.success('Data hewan qurban berhasil diperbarui')
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui hewan qurban: ${error.message}`)
    },
  })
}

interface DeleteQurbanAnimalInput {
  id: string
  event_id: string
  foto_url?: string | null
}

export function useDeleteQurbanAnimal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: DeleteQurbanAnimalInput) => {
      // Check if any shares exist for this animal
      const { count, error: countError } = await supabase
        .from('qurban_shares')
        .select('id', { count: 'exact', head: true })
        .eq('animal_id', input.id)

      if (countError) throw countError

      if ((count || 0) > 0) {
        throw new Error('Tidak bisa menghapus hewan yang sudah memiliki peserta')
      }

      // Delete photo from storage if exists
      if (input.foto_url) {
        await deleteAnimalPhoto(input.foto_url)
      }

      const { error } = await supabase
        .from('qurban_animals')
        .delete()
        .eq('id', input.id)

      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['qurban-animals', variables.event_id] })
      toast.success('Hewan qurban berhasil dihapus')
    },
    onError: (error: Error) => {
      toast.error(`Gagal menghapus hewan qurban: ${error.message}`)
    },
  })
}
