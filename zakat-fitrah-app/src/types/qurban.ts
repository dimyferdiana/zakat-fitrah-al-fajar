import type { QurbanRegistration, QurbanParticipant } from '@/types/database.types'

export type { QurbanRegistration, QurbanParticipant }

export interface QurbanRegistrationWithParticipants extends QurbanRegistration {
  qurban_participants: QurbanParticipant[]
}

export interface QurbanFormValues {
  tanggal: Date
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

export interface QurbanListParams {
  search?: string
  jenis?: 'sapi' | 'kambing' | 'all'
  status?: 'terdaftar' | 'lunas' | 'all'
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}

// -------------------------
// NEW: Animal-centric model
// -------------------------

export interface QurbanEvent {
  id: string
  nama: string
  tanggal: string
  catatan: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface QurbanAnimal {
  id: string
  event_id: string
  jenis: 'sapi' | 'kambing'
  sumber_hewan: 'beli' | 'titipan'
  nomor: string
  berat_kg: number | null
  harga: number
  biaya_perawatan: number | null
  foto_url: string | null
  catatan: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface QurbanShare {
  id: string
  animal_id: string
  muzakki_id: string
  urutan: number
  nominal: number
  status_pembayaran: 'belum_bayar' | 'lunas'
  catatan: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface QurbanShareWithMuzakki extends QurbanShare {
  muzakki: {
    id: string
    nama_kk: string
    no_telp: string | null
  }
}

export function getMaxSlots(jenis: 'sapi' | 'kambing'): number {
  return jenis === 'sapi' ? 7 : 1
}
