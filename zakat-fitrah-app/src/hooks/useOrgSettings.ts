import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface OrgSettings {
  id: string
  nama_lembaga: string
  alamat: string
  no_telp: string | null
  email: string | null
  logo_url: string | null
  updated_at: string
}

export interface UpdateOrgSettingsInput {
  nama_lembaga: string
  alamat: string
  no_telp?: string
  email?: string
  logo_url?: string
}

export interface UPZUnit {
  id: string
  nama_unit: string
  petugas_amil: string | null
  lokasi: string | null
  created_at: string
  updated_at: string
}

export interface CreateUPZUnitInput {
  nama_unit: string
  petugas_amil?: string
  lokasi?: string
}

export interface UpdateUPZUnitInput extends CreateUPZUnitInput {
  id: string
}

export function useOrgSettings() {
  return useQuery({
    queryKey: ['org_settings'],
    queryFn: async (): Promise<OrgSettings | null> => {
      const { data, error } = await (supabase as any)
        .from('org_settings')
        .select('*')
        .eq('id', 'org')
        .maybeSingle()
      if (error) throw error
      return data as OrgSettings | null
    },
  })
}

export function useUpdateOrgSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateOrgSettingsInput) => {
      const { data, error } = await (supabase as any)
        .from('org_settings')
        .upsert({
          id: 'org',
          nama_lembaga: input.nama_lembaga,
          alamat: input.alamat,
          no_telp: input.no_telp || null,
          email: input.email || null,
          logo_url: input.logo_url || null,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org_settings'] })
      toast.success('Pengaturan organisasi berhasil disimpan')
    },
    onError: (error: Error) => {
      toast.error(`Gagal menyimpan pengaturan: ${error.message}`)
    },
  })
}

export function useUPZUnitList() {
  return useQuery({
    queryKey: ['upz_units'],
    queryFn: async (): Promise<UPZUnit[]> => {
      const { data, error } = await (supabase as any)
        .from('upz_units')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data || []) as UPZUnit[]
    },
  })
}

export function useCreateUPZUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateUPZUnitInput) => {
      const { data, error } = await (supabase as any)
        .from('upz_units')
        .insert({
          nama_unit: input.nama_unit,
          petugas_amil: input.petugas_amil || null,
          lokasi: input.lokasi || null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upz_units'] })
      toast.success('Unit UPZ berhasil ditambahkan')
    },
    onError: (error: Error) => {
      toast.error(`Gagal menambahkan unit: ${error.message}`)
    },
  })
}

export function useUpdateUPZUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateUPZUnitInput) => {
      const { data, error } = await (supabase as any)
        .from('upz_units')
        .update({
          nama_unit: input.nama_unit,
          petugas_amil: input.petugas_amil || null,
          lokasi: input.lokasi || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upz_units'] })
      toast.success('Unit UPZ berhasil diperbarui')
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui unit: ${error.message}`)
    },
  })
}

export function useDeleteUPZUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('upz_units').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upz_units'] })
      toast.success('Unit UPZ berhasil dihapus')
    },
    onError: (error: Error) => {
      toast.error(`Gagal menghapus unit: ${error.message}`)
    },
  })
}
