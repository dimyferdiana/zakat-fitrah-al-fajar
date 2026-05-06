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
