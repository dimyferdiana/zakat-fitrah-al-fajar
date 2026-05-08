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

// -------------------------
// Coupon system
// -------------------------

export type QurbanCouponStatus = 'active' | 'redeemed' | 'cancelled'
export type QurbanCouponRecipientType = 'muzakki' | 'mustahik'

export interface QurbanCoupon {
  id: string
  event_id: string
  recipient_type: QurbanCouponRecipientType
  recipient_id: string
  qurban_share_id: string | null
  coupon_number: string
  token: string
  status: QurbanCouponStatus
  expires_at: string
  redeemed_at: string | null
  redeemed_by: string | null
  catatan: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface QurbanCouponWithRecipient extends QurbanCoupon {
  // Populated via join depending on recipient_type
  muzakki?: { id: string; nama_kk: string; no_telp: string | null }
  mustahik?: { id: string; nama: string; alamat: string }
  qurban_event?: { id: string; nama: string; tanggal: string }
  qurban_share?: {
    id: string
    urutan: number
    nominal: number
    qurban_animal?: { id: string; nomor: string; jenis: 'sapi' | 'kambing' }
  }
}

export interface QurbanCouponListParams {
  eventId?: string
  recipientType?: QurbanCouponRecipientType
  status?: QurbanCouponStatus | 'all'
  search?: string
  page?: number
  pageSize?: number
}

// For the flat participant list in QurbanPeserta page
export interface QurbanShareFlat {
  id: string
  animal_id: string
  urutan: number
  nominal: number
  status_pembayaran: 'belum_bayar' | 'lunas'
  catatan: string | null
  created_at: string
  muzakki_id: string
  muzakki_nama: string
  muzakki_no_telp: string | null
  animal_nomor: string
  animal_jenis: 'sapi' | 'kambing'
  event_id: string
  event_nama: string
  event_tanggal: string
  coupon?: QurbanCoupon | null
}

export interface QurbanShareListParams {
  eventId?: string
  status?: 'belum_bayar' | 'lunas' | 'all'
  search?: string
  page?: number
  pageSize?: number
}

// Dashboard stats
export interface QurbanDashboardStats {
  totalSapi: number
  totalKambing: number
  totalPeserta: number
  totalNominal: number
  lunasCount: number
  lunasNominal: number
  belumBayarCount: number
  belumBayarNominal: number
  couponsIssued: number
  couponsRedeemed: number
  perEvent: QurbanEventStats[]
}

export interface QurbanEventStats {
  event: QurbanEvent
  sapiCount: number
  kambingCount: number
  pesertaCount: number
  lunasNominal: number
  belumBayarNominal: number
  couponsIssued: number
  couponsRedeemed: number
}
