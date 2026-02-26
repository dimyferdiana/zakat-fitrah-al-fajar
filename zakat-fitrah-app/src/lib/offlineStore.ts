/**
 * Offline In-Memory Data Store
 * Provides realistic 2026 (1447 H) Zakat Fitrah seed data for offline/demo mode.
 * Supports CRUD operations that mutate the in-memory state.
 */

import type { PemasukanUang, PemasukanUangKategori, AkunUang } from '@/hooks/usePemasukanUang';
import type { PemasukanBeras, PemasukanBerasKategori } from '@/hooks/usePemasukanBeras';
import type { Distribusi } from '@/hooks/useDistribusi';
import type { Mustahik, KategoriMustahik } from '@/hooks/useMustahik';

// ---------- Types ----------

export interface TahunZakat {
  id: string;
  tahun_hijriah: string;
  tahun_masehi: number;
  nilai_beras_kg: number;
  nilai_uang_rp: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Muzakki {
  id: string;
  nama_kk: string;
  alamat: string;
  no_telp: string | null;
}

export interface PembayaranZakat {
  id: string;
  muzakki_id: string;
  muzakki: Muzakki;
  tahun_zakat_id: string;
  tanggal_bayar: string;
  jumlah_jiwa: number;
  jenis_zakat: 'beras' | 'uang';
  jumlah_beras_kg: number | null;
  jumlah_uang_rp: number | null;
  akun_uang: 'kas' | 'bank' | null;
  jumlah_uang_dibayar_rp: number | null;
  created_at: string;
  updated_at: string;
  sedekah_uang: number | null;
  sedekah_beras: number | null;
}

// ---------- Seed: Tahun Zakat ----------

const TAHUN_ZAKAT_SEED: TahunZakat[] = [
  {
    id: 'tz-2026',
    tahun_hijriah: '1447 H',
    tahun_masehi: 2026,
    nilai_beras_kg: 2.5,
    nilai_uang_rp: 45000,
    is_active: true,
    created_at: '2025-12-01T00:00:00Z',
    updated_at: '2025-12-01T00:00:00Z',
  },
  {
    id: 'tz-2025',
    tahun_hijriah: '1446 H',
    tahun_masehi: 2025,
    nilai_beras_kg: 2.5,
    nilai_uang_rp: 40000,
    is_active: false,
    created_at: '2024-12-01T00:00:00Z',
    updated_at: '2025-04-01T00:00:00Z',
  },
];

// ---------- Seed: Muzakki ----------

const MUZAKKI_SEED: Muzakki[] = [
  { id: 'mzk-01', nama_kk: 'Ahmad Fauzi', alamat: 'Jl. Merdeka No. 12, RT 01/02', no_telp: '08123456001' },
  { id: 'mzk-02', nama_kk: 'Muhammad Rizki', alamat: 'Jl. Nusa Indah No. 5, RT 02/03', no_telp: '08123456002' },
  { id: 'mzk-03', nama_kk: 'Sutrisno', alamat: 'Jl. Kenanga No. 8, RT 01/01', no_telp: null },
  { id: 'mzk-04', nama_kk: 'Wahyu Hidayat', alamat: 'Jl. Mawar No. 3, RT 03/02', no_telp: '08123456004' },
  { id: 'mzk-05', nama_kk: 'Budi Santoso', alamat: 'Jl. Melati No. 17, RT 02/01', no_telp: '08123456005' },
  { id: 'mzk-06', nama_kk: 'Subiyanto', alamat: 'Jl. Anggrek No. 4, RT 04/03', no_telp: null },
  { id: 'mzk-07', nama_kk: 'Hendra Kurniawan', alamat: 'Jl. Dahlia No. 9, RT 01/03', no_telp: '08123456007' },
  { id: 'mzk-08', nama_kk: 'Eko Prasetyo', alamat: 'Jl. Flamboyan No. 22, RT 02/02', no_telp: '08123456008' },
  { id: 'mzk-09', nama_kk: 'Agus Salim', alamat: 'Jl. Bangau No. 6, RT 03/01', no_telp: '08123456009' },
  { id: 'mzk-10', nama_kk: 'Dwi Lestari', alamat: 'Jl. Kamboja No. 11, RT 01/02', no_telp: null },
  { id: 'mzk-11', nama_kk: 'Siti Rahayu', alamat: 'Jl. Raflesia No. 2, RT 02/03', no_telp: '08123456011' },
  { id: 'mzk-12', nama_kk: 'Abdul Hamid', alamat: 'Jl. Seroja No. 7, RT 04/01', no_telp: '08123456012' },
  { id: 'mzk-13', nama_kk: 'Nurul Huda', alamat: 'Jl. Teratai No. 15, RT 01/04', no_telp: null },
  { id: 'mzk-14', nama_kk: 'Bambang Wijaya', alamat: 'Jl. Cempaka No. 19, RT 03/03', no_telp: '08123456014' },
  { id: 'mzk-15', nama_kk: 'Rina Wati', alamat: 'Jl. Asoka No. 1, RT 02/04', no_telp: '08123456015' },
  { id: 'mzk-16', nama_kk: 'Taufiqurrahman', alamat: 'Jl. Bougenville No. 13, RT 04/02', no_telp: null },
  { id: 'mzk-17', nama_kk: 'Yusuf Effendi', alamat: 'Jl. Gardenia No. 28, RT 01/03', no_telp: '08123456017' },
  { id: 'mzk-18', nama_kk: 'Dewi Susanti', alamat: 'Jl. Helikronis No. 10, RT 03/04', no_telp: '08123456018' },
  { id: 'mzk-19', nama_kk: 'Moch. Arifin', alamat: 'Jl. Impatiens No. 33, RT 02/01', no_telp: null },
  { id: 'mzk-20', nama_kk: 'Sri Wahyuni', alamat: 'Jl. Jasminum No. 14, RT 01/02', no_telp: '08123456020' },
  { id: 'mzk-21', nama_kk: 'Khairul Anwar', alamat: 'Jl. Kenari No. 6, RT 04/03', no_telp: '08123456021' },
  { id: 'mzk-22', nama_kk: 'Lestari Dewi', alamat: 'Jl. Lavender No. 20, RT 02/02', no_telp: null },
  { id: 'mzk-23', nama_kk: 'Muhamad Soleh', alamat: 'Jl. Magnolia No. 5, RT 03/01', no_telp: '08123456023' },
  { id: 'mzk-24', nama_kk: 'Nuraini', alamat: 'Jl. Matahari No. 9, RT 01/04', no_telp: '08123456024' },
  { id: 'mzk-25', nama_kk: 'Ongky Prasetya', alamat: 'Jl. Nilam No. 16, RT 04/01', no_telp: null },
  { id: 'mzk-26', nama_kk: 'Puji Astuti', alamat: 'Jl. Orchid No. 3, RT 02/03', no_telp: '08123456026' },
  { id: 'mzk-27', nama_kk: 'Qomar Firdaus', alamat: 'Jl. Pelangi No. 11, RT 03/02', no_telp: '08123456027' },
  { id: 'mzk-28', nama_kk: 'Rudi Hartono', alamat: 'Jl. Pinus No. 7, RT 01/01', no_telp: null },
  { id: 'mzk-29', nama_kk: 'Slamet Riyadi', alamat: 'Jl. Rambutan No. 25, RT 04/04', no_telp: '08123456029' },
  { id: 'mzk-30', nama_kk: 'Tri Handayani', alamat: 'Jl. Rose No. 4, RT 02/04', no_telp: '08123456030' },
  { id: 'mzk-31', nama_kk: 'Umar Faruk', alamat: 'Jl. Sakura No. 18, RT 03/03', no_telp: null },
  { id: 'mzk-32', nama_kk: 'Vina Rosalina', alamat: 'Jl. Sedap Malam No. 8, RT 01/03', no_telp: '08123456032' },
  { id: 'mzk-33', nama_kk: 'Widodo', alamat: 'Jl. Srikaya No. 12, RT 02/01', no_telp: '08123456033' },
  { id: 'mzk-34', nama_kk: 'Xandi Pratama', alamat: 'Jl. Tamarind No. 2, RT 04/02', no_telp: null },
  { id: 'mzk-35', nama_kk: 'Yayuk Setiawati', alamat: 'Jl. Tebu No. 23, RT 01/04', no_telp: '08123456035' },
  { id: 'mzk-36', nama_kk: 'Zainal Abidin', alamat: 'Jl. Tulip No. 17, RT 03/01', no_telp: '08123456036' },
  { id: 'mzk-37', nama_kk: 'Arif Budiman', alamat: 'Jl. Ume No. 6, RT 02/03', no_telp: null },
  { id: 'mzk-38', nama_kk: 'Basuki Rahmat', alamat: 'Jl. Violet No. 10, RT 04/03', no_telp: '08123456038' },
  { id: 'mzk-39', nama_kk: 'Cahyono', alamat: 'Jl. Wangsa No. 14, RT 01/02', no_telp: '08123456039' },
  { id: 'mzk-40', nama_kk: 'Diah Purnama', alamat: 'Jl. Xanthium No. 3, RT 03/04', no_telp: null },
];

// ---------- Seed: Pembayaran Zakat ----------
// Ramadan 1447H: ~Feb 28 – Mar 28, 2026. Zakat Fitrah collected Mar 15-28, 2026.

const PEMBAYARAN_BERAS: PembayaranZakat[] = [
  // id, muzakki_id, jiwa, beras_kg (jiwa × 2.5)
  { id: 'pbr-01', muzakki_id: 'mzk-01', jumlah_jiwa: 5, jumlah_beras_kg: 12.5, tanggal_bayar: '2026-03-15', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbr-02', muzakki_id: 'mzk-02', jumlah_jiwa: 4, jumlah_beras_kg: 10.0, tanggal_bayar: '2026-03-16', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbr-03', muzakki_id: 'mzk-03', jumlah_jiwa: 3, jumlah_beras_kg: 7.5,  tanggal_bayar: '2026-03-16', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbr-04', muzakki_id: 'mzk-04', jumlah_jiwa: 4, jumlah_beras_kg: 10.0, tanggal_bayar: '2026-03-17', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbr-05', muzakki_id: 'mzk-05', jumlah_jiwa: 6, jumlah_beras_kg: 15.0, tanggal_bayar: '2026-03-17', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbr-06', muzakki_id: 'mzk-06', jumlah_jiwa: 3, jumlah_beras_kg: 7.5,  tanggal_bayar: '2026-03-18', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbr-07', muzakki_id: 'mzk-07', jumlah_jiwa: 5, jumlah_beras_kg: 12.5, tanggal_bayar: '2026-03-18', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbr-08', muzakki_id: 'mzk-08', jumlah_jiwa: 4, jumlah_beras_kg: 10.0, tanggal_bayar: '2026-03-19', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbr-09', muzakki_id: 'mzk-09', jumlah_jiwa: 7, jumlah_beras_kg: 17.5, tanggal_bayar: '2026-03-19', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbr-10', muzakki_id: 'mzk-10', jumlah_jiwa: 4, jumlah_beras_kg: 10.0, tanggal_bayar: '2026-03-20', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbr-11', muzakki_id: 'mzk-11', jumlah_jiwa: 3, jumlah_beras_kg: 7.5,  tanggal_bayar: '2026-03-20', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbr-12', muzakki_id: 'mzk-12', jumlah_jiwa: 5, jumlah_beras_kg: 12.5, tanggal_bayar: '2026-03-21', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbr-13', muzakki_id: 'mzk-13', jumlah_jiwa: 4, jumlah_beras_kg: 10.0, tanggal_bayar: '2026-03-21', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbr-14', muzakki_id: 'mzk-14', jumlah_jiwa: 2, jumlah_beras_kg: 5.0,  tanggal_bayar: '2026-03-22', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbr-15', muzakki_id: 'mzk-15', jumlah_jiwa: 6, jumlah_beras_kg: 15.0, tanggal_bayar: '2026-03-22', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbr-16', muzakki_id: 'mzk-16', jumlah_jiwa: 4, jumlah_beras_kg: 10.0, tanggal_bayar: '2026-03-23', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbr-17', muzakki_id: 'mzk-17', jumlah_jiwa: 5, jumlah_beras_kg: 12.5, tanggal_bayar: '2026-03-23', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbr-18', muzakki_id: 'mzk-18', jumlah_jiwa: 3, jumlah_beras_kg: 7.5,  tanggal_bayar: '2026-03-24', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbr-19', muzakki_id: 'mzk-19', jumlah_jiwa: 4, jumlah_beras_kg: 10.0, tanggal_bayar: '2026-03-24', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbr-20', muzakki_id: 'mzk-20', jumlah_jiwa: 5, jumlah_beras_kg: 12.5, tanggal_bayar: '2026-03-25', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbr-21', muzakki_id: 'mzk-21', jumlah_jiwa: 4, jumlah_beras_kg: 10.0, tanggal_bayar: '2026-03-25', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbr-22', muzakki_id: 'mzk-22', jumlah_jiwa: 3, jumlah_beras_kg: 7.5,  tanggal_bayar: '2026-03-26', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbr-23', muzakki_id: 'mzk-23', jumlah_jiwa: 4, jumlah_beras_kg: 10.0, tanggal_bayar: '2026-03-26', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbr-24', muzakki_id: 'mzk-24', jumlah_jiwa: 6, jumlah_beras_kg: 15.0, tanggal_bayar: '2026-03-27', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbr-25', muzakki_id: 'mzk-25', jumlah_jiwa: 4, jumlah_beras_kg: 10.0, tanggal_bayar: '2026-03-27', jenis_zakat: 'beras', jumlah_uang_rp: null, akun_uang: null, jumlah_uang_dibayar_rp: null, sedekah_uang: null, sedekah_beras: null },
].map((p) => {
  const mzk = MUZAKKI_SEED.find((m) => m.id === p.muzakki_id)!;
  return { ...p, jenis_zakat: p.jenis_zakat as 'beras' | 'uang', muzakki: mzk, tahun_zakat_id: 'tz-2026', created_at: `${p.tanggal_bayar}T08:00:00Z`, updated_at: `${p.tanggal_bayar}T08:00:00Z` };
});

// Total beras from pembayaran: 12.5+10+7.5+10+15+7.5+12.5+10+17.5+10+7.5+12.5+10+5+15+10+12.5+7.5+10+12.5+10+7.5+10+15+10 = 265 kg

const PEMBAYARAN_UANG: PembayaranZakat[] = [
  { id: 'pbu-01', muzakki_id: 'mzk-26', jumlah_jiwa: 4, jumlah_uang_rp: 180000, tanggal_bayar: '2026-03-16', jenis_zakat: 'uang', jumlah_beras_kg: null, akun_uang: 'kas',  jumlah_uang_dibayar_rp: 180000, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbu-02', muzakki_id: 'mzk-27', jumlah_jiwa: 5, jumlah_uang_rp: 225000, tanggal_bayar: '2026-03-17', jenis_zakat: 'uang', jumlah_beras_kg: null, akun_uang: 'bank', jumlah_uang_dibayar_rp: 225000, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbu-03', muzakki_id: 'mzk-28', jumlah_jiwa: 3, jumlah_uang_rp: 135000, tanggal_bayar: '2026-03-18', jenis_zakat: 'uang', jumlah_beras_kg: null, akun_uang: 'kas',  jumlah_uang_dibayar_rp: 135000, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbu-04', muzakki_id: 'mzk-29', jumlah_jiwa: 4, jumlah_uang_rp: 180000, tanggal_bayar: '2026-03-19', jenis_zakat: 'uang', jumlah_beras_kg: null, akun_uang: 'kas',  jumlah_uang_dibayar_rp: 180000, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbu-05', muzakki_id: 'mzk-30', jumlah_jiwa: 6, jumlah_uang_rp: 270000, tanggal_bayar: '2026-03-19', jenis_zakat: 'uang', jumlah_beras_kg: null, akun_uang: 'bank', jumlah_uang_dibayar_rp: 270000, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbu-06', muzakki_id: 'mzk-31', jumlah_jiwa: 4, jumlah_uang_rp: 180000, tanggal_bayar: '2026-03-20', jenis_zakat: 'uang', jumlah_beras_kg: null, akun_uang: 'kas',  jumlah_uang_dibayar_rp: 180000, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbu-07', muzakki_id: 'mzk-32', jumlah_jiwa: 2, jumlah_uang_rp:  90000, tanggal_bayar: '2026-03-21', jenis_zakat: 'uang', jumlah_beras_kg: null, akun_uang: 'kas',  jumlah_uang_dibayar_rp:  90000, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbu-08', muzakki_id: 'mzk-33', jumlah_jiwa: 5, jumlah_uang_rp: 225000, tanggal_bayar: '2026-03-22', jenis_zakat: 'uang', jumlah_beras_kg: null, akun_uang: 'bank', jumlah_uang_dibayar_rp: 225000, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbu-09', muzakki_id: 'mzk-34', jumlah_jiwa: 3, jumlah_uang_rp: 135000, tanggal_bayar: '2026-03-23', jenis_zakat: 'uang', jumlah_beras_kg: null, akun_uang: 'kas',  jumlah_uang_dibayar_rp: 135000, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbu-10', muzakki_id: 'mzk-35', jumlah_jiwa: 4, jumlah_uang_rp: 180000, tanggal_bayar: '2026-03-24', jenis_zakat: 'uang', jumlah_beras_kg: null, akun_uang: 'bank', jumlah_uang_dibayar_rp: 180000, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbu-11', muzakki_id: 'mzk-36', jumlah_jiwa: 5, jumlah_uang_rp: 225000, tanggal_bayar: '2026-03-24', jenis_zakat: 'uang', jumlah_beras_kg: null, akun_uang: 'kas',  jumlah_uang_dibayar_rp: 225000, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbu-12', muzakki_id: 'mzk-37', jumlah_jiwa: 4, jumlah_uang_rp: 180000, tanggal_bayar: '2026-03-25', jenis_zakat: 'uang', jumlah_beras_kg: null, akun_uang: 'bank', jumlah_uang_dibayar_rp: 180000, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbu-13', muzakki_id: 'mzk-38', jumlah_jiwa: 3, jumlah_uang_rp: 135000, tanggal_bayar: '2026-03-26', jenis_zakat: 'uang', jumlah_beras_kg: null, akun_uang: 'kas',  jumlah_uang_dibayar_rp: 135000, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbu-14', muzakki_id: 'mzk-39', jumlah_jiwa: 6, jumlah_uang_rp: 270000, tanggal_bayar: '2026-03-27', jenis_zakat: 'uang', jumlah_beras_kg: null, akun_uang: 'bank', jumlah_uang_dibayar_rp: 270000, sedekah_uang: null, sedekah_beras: null },
  { id: 'pbu-15', muzakki_id: 'mzk-40', jumlah_jiwa: 4, jumlah_uang_rp: 180000, tanggal_bayar: '2026-03-28', jenis_zakat: 'uang', jumlah_beras_kg: null, akun_uang: 'kas',  jumlah_uang_dibayar_rp: 180000, sedekah_uang: null, sedekah_beras: null },
].map((p) => {
  const mzk = MUZAKKI_SEED.find((m) => m.id === p.muzakki_id)!;
  return { ...p, jenis_zakat: p.jenis_zakat as 'beras' | 'uang', akun_uang: p.akun_uang as 'kas' | 'bank' | null, muzakki: mzk, tahun_zakat_id: 'tz-2026', created_at: `${p.tanggal_bayar}T09:00:00Z`, updated_at: `${p.tanggal_bayar}T09:00:00Z` };
});

// Total uang from pembayaran: 180+225+135+180+270+180+90+225+135+180+225+180+135+270+180 = 2,790,000 Rp

// ---------- Seed: Pemasukan Uang (additional categories) ----------

const PEMASUKAN_UANG_SEED: PemasukanUang[] = [
  { id: 'pu-01', tahun_zakat_id: 'tz-2026', muzakki_id: null, muzakki: null, kategori: 'fidyah_uang',          akun: 'kas',  jumlah_uang_rp: 50000,   tanggal: '2026-03-10', catatan: 'Fidyah 1 orang sakit kronis', created_by: 'mock-admin-001', created_at: '2026-03-10T10:00:00Z' },
  { id: 'pu-02', tahun_zakat_id: 'tz-2026', muzakki_id: null, muzakki: null, kategori: 'fidyah_uang',          akun: 'kas',  jumlah_uang_rp: 175000,  tanggal: '2026-03-12', catatan: 'Fidyah 3.5 orang', created_by: 'mock-admin-001', created_at: '2026-03-12T10:00:00Z' },
  { id: 'pu-03', tahun_zakat_id: 'tz-2026', muzakki_id: 'mzk-01', muzakki: { id: 'mzk-01', nama_kk: 'Ahmad Fauzi' }, kategori: 'infak_sedekah_uang', akun: 'kas',  jumlah_uang_rp: 200000,  tanggal: '2026-03-15', catatan: 'Infak bulanan', created_by: 'mock-admin-001', created_at: '2026-03-15T11:00:00Z' },
  { id: 'pu-04', tahun_zakat_id: 'tz-2026', muzakki_id: 'mzk-05', muzakki: { id: 'mzk-05', nama_kk: 'Budi Santoso' }, kategori: 'infak_sedekah_uang', akun: 'bank', jumlah_uang_rp: 500000,  tanggal: '2026-03-17', catatan: 'Sedekah jariyah masjid', created_by: 'mock-admin-001', created_at: '2026-03-17T09:00:00Z' },
  { id: 'pu-05', tahun_zakat_id: 'tz-2026', muzakki_id: null, muzakki: null, kategori: 'infak_sedekah_uang', akun: 'kas',  jumlah_uang_rp: 150000,  tanggal: '2026-03-20', catatan: 'Kotak amal Jumat', created_by: 'mock-bendahara-001', created_at: '2026-03-20T14:00:00Z' },
  { id: 'pu-06', tahun_zakat_id: 'tz-2026', muzakki_id: 'mzk-12', muzakki: { id: 'mzk-12', nama_kk: 'Abdul Hamid' }, kategori: 'maal_penghasilan_uang', akun: 'bank', jumlah_uang_rp: 800000,  tanggal: '2026-03-05', catatan: 'Zakat penghasilan bulan Maret', created_by: 'mock-admin-001', created_at: '2026-03-05T09:00:00Z' },
  { id: 'pu-07', tahun_zakat_id: 'tz-2026', muzakki_id: 'mzk-17', muzakki: { id: 'mzk-17', nama_kk: 'Yusuf Effendi' }, kategori: 'maal_penghasilan_uang', akun: 'bank', jumlah_uang_rp: 1200000, tanggal: '2026-03-10', catatan: 'Zakat tijarah/perdagangan', created_by: 'mock-admin-001', created_at: '2026-03-10T08:00:00Z' },
  { id: 'pu-08', tahun_zakat_id: 'tz-2026', muzakki_id: 'mzk-23', muzakki: { id: 'mzk-23', nama_kk: 'Muhamad Soleh' }, kategori: 'maal_penghasilan_uang', akun: 'kas',  jumlah_uang_rp: 500000,  tanggal: '2026-03-14', catatan: 'Zakat penghasilan freelance', created_by: 'mock-admin-001', created_at: '2026-03-14T10:00:00Z' },
];
// fidyahUang: 50000+175000 = 225,000
// infakSedekahUang: 200000+500000+150000 = 850,000
// maalUang: 800000+1200000+500000 = 2,500,000

// ---------- Seed: Pemasukan Beras ----------

const PEMASUKAN_BERAS_SEED: PemasukanBeras[] = [
  { id: 'pmbr-01', tahun_zakat_id: 'tz-2026', muzakki_id: 'mzk-02', muzakki: { id: 'mzk-02', nama_kk: 'Muhammad Rizki' }, kategori: 'infak_sedekah_beras', jumlah_beras_kg: 10.0, tanggal: '2026-03-18', catatan: 'Sedekah beras dari panen', created_by: 'mock-admin-001', created_at: '2026-03-18T10:00:00Z' },
  { id: 'pmbr-02', tahun_zakat_id: 'tz-2026', muzakki_id: null, muzakki: null, kategori: 'infak_sedekah_beras', jumlah_beras_kg: 7.5,  tanggal: '2026-03-21', catatan: 'Donasi beras anonim', created_by: 'mock-bendahara-001', created_at: '2026-03-21T11:00:00Z' },
  { id: 'pmbr-03', tahun_zakat_id: 'tz-2026', muzakki_id: 'mzk-09', muzakki: { id: 'mzk-09', nama_kk: 'Agus Salim' }, kategori: 'infak_sedekah_beras', jumlah_beras_kg: 5.0,  tanggal: '2026-03-24', catatan: 'Infak beras dari anggota', created_by: 'mock-admin-001', created_at: '2026-03-24T09:00:00Z' },
  { id: 'pmbr-04', tahun_zakat_id: 'tz-2026', muzakki_id: null, muzakki: null, kategori: 'fidyah_beras', jumlah_beras_kg: 2.5, tanggal: '2026-03-16', catatan: 'Fidyah beras 1 jiwa', created_by: 'mock-admin-001', created_at: '2026-03-16T08:00:00Z' },
];
// infakSedekahBeras: 10+7.5+5 = 22.5 kg
// fidyahBeras: 2.5 kg

// ---------- Seed: Kategori Mustahik ----------

const KATEGORI_MUSTAHIK_SEED: KategoriMustahik[] = [
  { id: 'km-01', nama: 'Fakir', deskripsi: 'Orang yang tidak memiliki harta dan penghasilan sama sekali', created_at: '2025-01-01T00:00:00Z' },
  { id: 'km-02', nama: 'Miskin', deskripsi: 'Orang yang berpenghasilan namun tidak mencukupi kebutuhan pokok', created_at: '2025-01-01T00:00:00Z' },
  { id: 'km-03', nama: 'Amil', deskripsi: 'Panitia pengelola dan pengurus zakat', created_at: '2025-01-01T00:00:00Z' },
  { id: 'km-04', nama: 'Muallaf', deskripsi: 'Orang yang baru masuk Islam atau yang hatinya perlu dikuatkan', created_at: '2025-01-01T00:00:00Z' },
  { id: 'km-05', nama: 'Ibnu Sabil', deskripsi: 'Musafir yang kehabisan bekal dalam perjalanan yang diizinkan', created_at: '2025-01-01T00:00:00Z' },
];

// ---------- Seed: Mustahik ----------

const MUSTAHIK_SEED: Mustahik[] = [
  // Fakir (km-01)
  { id: 'mth-01', nama: 'Pak Sarno', alamat: 'Jl. Kemuning No. 2', kategori_id: 'km-01', jumlah_anggota: 3, no_telp: null, catatan: 'Tidak memiliki pekerjaan tetap', is_active: true, is_data_lama: false, created_at: '2025-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[0] },
  { id: 'mth-02', nama: 'Bu Suminah', alamat: 'Jl. Pandan No. 7', kategori_id: 'km-01', jumlah_anggota: 2, no_telp: null, catatan: 'Janda lansia, tidak punya keluarga', is_active: true, is_data_lama: false, created_at: '2025-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[0] },
  { id: 'mth-03', nama: 'Ahmad Mansur', alamat: 'Jl. Aren No. 14', kategori_id: 'km-01', jumlah_anggota: 5, no_telp: null, catatan: 'Kepala keluarga sakit kronis', is_active: true, is_data_lama: false, created_at: '2025-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[0] },
  { id: 'mth-04', nama: 'Mbah Sinem', alamat: 'Jl. Jati No. 3', kategori_id: 'km-01', jumlah_anggota: 1, no_telp: null, catatan: 'Nenek sebatang kara', is_active: true, is_data_lama: true, created_at: '2023-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[0] },
  { id: 'mth-05', nama: 'Pak Karyo', alamat: 'Jl. Bambu No. 9', kategori_id: 'km-01', jumlah_anggota: 4, no_telp: null, catatan: 'Driver ojol, sering tidak ada penghasilan', is_active: true, is_data_lama: false, created_at: '2025-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[0] },
  { id: 'mth-06', nama: 'Bu Parinem', alamat: 'Jl. Weru No. 11', kategori_id: 'km-01', jumlah_anggota: 3, no_telp: null, catatan: 'Janda dengan 2 anak kecil', is_active: true, is_data_lama: true, created_at: '2024-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[0] },
  { id: 'mth-07', nama: 'Pak Misno', alamat: 'Jl. Sonokeling No. 5', kategori_id: 'km-01', jumlah_anggota: 6, no_telp: null, catatan: 'Buruh tani musiman', is_active: false, is_data_lama: false, created_at: '2024-02-01T00:00:00Z', updated_at: '2025-10-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[0] },
  // Miskin (km-02)
  { id: 'mth-08', nama: 'Keluarga Triyono', alamat: 'Jl. Merak No. 8', kategori_id: 'km-02', jumlah_anggota: 4, no_telp: '08112345001', catatan: 'Pedagang kaki lima', is_active: true, is_data_lama: false, created_at: '2025-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[1] },
  { id: 'mth-09', nama: 'Keluarga Hariyanto', alamat: 'Jl. Elang No. 15', kategori_id: 'km-02', jumlah_anggota: 5, no_telp: null, catatan: 'Tukang cuci, penghasilan tidak tetap', is_active: true, is_data_lama: false, created_at: '2025-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[1] },
  { id: 'mth-10', nama: 'Keluarga Supardi', alamat: 'Jl. Garuda No. 4', kategori_id: 'km-02', jumlah_anggota: 3, no_telp: '08112345002', catatan: 'Buruh pabrik kontrak', is_active: true, is_data_lama: false, created_at: '2025-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[1] },
  { id: 'mth-11', nama: 'Keluarga Nugroho', alamat: 'Jl. Beo No. 19', kategori_id: 'km-02', jumlah_anggota: 6, no_telp: null, catatan: 'Petani sawah 0.2 ha', is_active: true, is_data_lama: true, created_at: '2023-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[1] },
  { id: 'mth-12', nama: 'Keluarga Suparno', alamat: 'Jl. Kutilang No. 22', kategori_id: 'km-02', jumlah_anggota: 4, no_telp: '08112345003', catatan: 'Penjual gorengan', is_active: true, is_data_lama: false, created_at: '2025-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[1] },
  { id: 'mth-13', nama: 'Keluarga Wage', alamat: 'Jl. Walet No. 6', kategori_id: 'km-02', jumlah_anggota: 5, no_telp: null, catatan: 'Pemulung, penghasilan tidak menentu', is_active: true, is_data_lama: false, created_at: '2025-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[1] },
  { id: 'mth-14', nama: 'Keluarga Ponimin', alamat: 'Jl. Pipit No. 13', kategori_id: 'km-02', jumlah_anggota: 3, no_telp: '08112345004', catatan: 'Tukang becak', is_active: true, is_data_lama: true, created_at: '2024-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[1] },
  { id: 'mth-15', nama: 'Keluarga Jumadi', alamat: 'Jl. Nuri No. 17', kategori_id: 'km-02', jumlah_anggota: 7, no_telp: null, catatan: 'Buruh harian lepas', is_active: true, is_data_lama: false, created_at: '2025-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[1] },
  { id: 'mth-16', nama: 'Keluarga Kasimo', alamat: 'Jl. Perkutut No. 2', kategori_id: 'km-02', jumlah_anggota: 4, no_telp: null, catatan: 'Jual beli barang bekas', is_active: false, is_data_lama: false, created_at: '2025-02-01T00:00:00Z', updated_at: '2025-11-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[1] },
  { id: 'mth-17', nama: 'Keluarga Sohib', alamat: 'Jl. Derkuku No. 10', kategori_id: 'km-02', jumlah_anggota: 5, no_telp: '08112345005', catatan: 'Tukang parkir, penghasilan < UMR', is_active: true, is_data_lama: false, created_at: '2025-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[1] },
  // Amil (km-03)
  { id: 'mth-18', nama: 'Panitia Zakat RT 01', alamat: 'Masjid Al-Fajar, Jl. Merdeka', kategori_id: 'km-03', jumlah_anggota: 3, no_telp: '08123456001', catatan: 'Koordinator pengumpulan dan penyaluran', is_active: true, is_data_lama: false, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[2] },
  { id: 'mth-19', nama: 'Panitia Zakat RT 02', alamat: 'Masjid Al-Fajar, Jl. Merdeka', kategori_id: 'km-03', jumlah_anggota: 3, no_telp: '08123456002', catatan: 'Koordinator RT 02', is_active: true, is_data_lama: false, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[2] },
  // Muallaf (km-04)
  { id: 'mth-20', nama: 'Bapak Kevin', alamat: 'Jl. Kersen No. 4', kategori_id: 'km-04', jumlah_anggota: 2, no_telp: '08112345006', catatan: 'Mualaf baru, butuh dukungan', is_active: true, is_data_lama: false, created_at: '2025-08-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[3] },
  { id: 'mth-21', nama: 'Ibu Rini', alamat: 'Jl. Jambu No. 12', kategori_id: 'km-04', jumlah_anggota: 1, no_telp: null, catatan: 'Baru syahadat, dukungan ekonomi', is_active: true, is_data_lama: false, created_at: '2025-10-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[3] },
  // Ibnu Sabil (km-05)
  { id: 'mth-22', nama: 'Pak Suryo (musafir)', alamat: '-', kategori_id: 'km-05', jumlah_anggota: 1, no_telp: null, catatan: 'Sedang dalam perjalanan studi, kehabisan bekal', is_active: true, is_data_lama: false, created_at: '2026-03-10T00:00:00Z', updated_at: '2026-03-10T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[4] },
  // More miskin
  { id: 'mth-23', nama: 'Keluarga Darko', alamat: 'Jl. Belimbing No. 3', kategori_id: 'km-02', jumlah_anggota: 4, no_telp: null, catatan: 'Nelayan, musim paceklik', is_active: true, is_data_lama: false, created_at: '2025-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[1] },
  { id: 'mth-24', nama: 'Keluarga Markus', alamat: 'Jl. Alpukat No. 8', kategori_id: 'km-02', jumlah_anggota: 3, no_telp: '08112345007', catatan: 'Penghasilan di bawah UMK', is_active: true, is_data_lama: false, created_at: '2025-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[1] },
  { id: 'mth-25', nama: 'Keluarga Pardi', alamat: 'Jl. Mangga No. 5', kategori_id: 'km-02', jumlah_anggota: 5, no_telp: null, catatan: 'Buruh bangunan tidak tetap', is_active: true, is_data_lama: false, created_at: '2025-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[1] },
  { id: 'mth-26', nama: 'Keluarga Sogol', alamat: 'Jl. Pepaya No. 16', kategori_id: 'km-02', jumlah_anggota: 4, no_telp: null, catatan: 'Petani tadah hujan', is_active: true, is_data_lama: true, created_at: '2023-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[1] },
  { id: 'mth-27', nama: 'Keluarga Tomo', alamat: 'Jl. Rambutan No. 9', kategori_id: 'km-02', jumlah_anggota: 6, no_telp: null, catatan: 'Tukang las, penghasilan tidak menentu', is_active: true, is_data_lama: false, created_at: '2025-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[1] },
  { id: 'mth-28', nama: 'Keluarga Udin', alamat: 'Jl. Sawo No. 21', kategori_id: 'km-02', jumlah_anggota: 3, no_telp: '08112345008', catatan: 'Pedagang sayur keliling', is_active: true, is_data_lama: false, created_at: '2025-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[1] },
  { id: 'mth-29', nama: 'Keluarga Wagino', alamat: 'Jl. Sirsak No. 7', kategori_id: 'km-02', jumlah_anggota: 5, no_telp: null, catatan: 'Sopir angkot, penumpang sepi', is_active: true, is_data_lama: false, created_at: '2025-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[1] },
  { id: 'mth-30', nama: 'Keluarga Yanto', alamat: 'Jl. Sukun No. 4', kategori_id: 'km-02', jumlah_anggota: 4, no_telp: null, catatan: 'Kuli angkut pasar', is_active: true, is_data_lama: false, created_at: '2025-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[1] },
  { id: 'mth-31', nama: 'Keluarga Zuhri', alamat: 'Jl. Durian No. 18', kategori_id: 'km-02', jumlah_anggota: 3, no_telp: null, catatan: 'Penganggur, tanggungan 2 anak', is_active: false, is_data_lama: false, created_at: '2025-06-01T00:00:00Z', updated_at: '2025-12-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[1] },
  // More fakir
  { id: 'mth-32', nama: 'Bu Juminten', alamat: 'Jl. Nangka No. 6', kategori_id: 'km-01', jumlah_anggota: 2, no_telp: null, catatan: 'Cerai, tidak ada nafkah', is_active: true, is_data_lama: false, created_at: '2025-04-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[0] },
  { id: 'mth-33', nama: 'Pak Kasim', alamat: 'Jl. Kelengkeng No. 10', kategori_id: 'km-01', jumlah_anggota: 4, no_telp: null, catatan: 'Disabilitas, tidak bisa bekerja', is_active: true, is_data_lama: false, created_at: '2025-04-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[0] },
  { id: 'mth-34', nama: 'Bu Lastri', alamat: 'Jl. Lengkeng No. 15', kategori_id: 'km-01', jumlah_anggota: 3, no_telp: null, catatan: 'Lansia, tidak ada anak', is_active: true, is_data_lama: true, created_at: '2022-02-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[0] },
  { id: 'mth-35', nama: 'Pak Karto Miskin', alamat: 'Jl. Salak No. 1', kategori_id: 'km-01', jumlah_anggota: 5, no_telp: null, catatan: 'Gelandangan yang kini tinggal di masjid', is_active: true, is_data_lama: false, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z', kategori_mustahik: KATEGORI_MUSTAHIK_SEED[0] },
];
// activeCount: count where is_active=true → 33
// nonActiveCount: 3 (mth-07, mth-16, mth-31)

// ---------- Seed: Distribusi ----------

const DISTRIBUSI_SEED: Distribusi[] = [
  // Distribusi beras (already selesai)
  { id: 'dst-01', mustahik_id: 'mth-01', tahun_zakat_id: 'tz-2026', jenis_distribusi: 'beras', jumlah: 10, tanggal_distribusi: '2026-03-28', status: 'selesai', catatan: null, created_at: '2026-03-28T08:00:00Z', updated_at: '2026-03-28T10:00:00Z', mustahik: { id: 'mth-01', nama: 'Pak Sarno', alamat: 'Jl. Kemuning No. 2', kategori_mustahik: { nama: 'Fakir' } }, tahun_zakat: { tahun_hijriah: '1447 H', tahun_masehi: 2026 } },
  { id: 'dst-02', mustahik_id: 'mth-02', tahun_zakat_id: 'tz-2026', jenis_distribusi: 'beras', jumlah: 7.5, tanggal_distribusi: '2026-03-28', status: 'selesai', catatan: null, created_at: '2026-03-28T08:10:00Z', updated_at: '2026-03-28T10:00:00Z', mustahik: { id: 'mth-02', nama: 'Bu Suminah', alamat: 'Jl. Pandan No. 7', kategori_mustahik: { nama: 'Fakir' } }, tahun_zakat: { tahun_hijriah: '1447 H', tahun_masehi: 2026 } },
  { id: 'dst-03', mustahik_id: 'mth-03', tahun_zakat_id: 'tz-2026', jenis_distribusi: 'beras', jumlah: 12.5, tanggal_distribusi: '2026-03-28', status: 'selesai', catatan: null, created_at: '2026-03-28T08:20:00Z', updated_at: '2026-03-28T10:00:00Z', mustahik: { id: 'mth-03', nama: 'Ahmad Mansur', alamat: 'Jl. Aren No. 14', kategori_mustahik: { nama: 'Fakir' } }, tahun_zakat: { tahun_hijriah: '1447 H', tahun_masehi: 2026 } },
  { id: 'dst-04', mustahik_id: 'mth-04', tahun_zakat_id: 'tz-2026', jenis_distribusi: 'beras', jumlah: 5, tanggal_distribusi: '2026-03-28', status: 'selesai', catatan: null, created_at: '2026-03-28T08:30:00Z', updated_at: '2026-03-28T10:00:00Z', mustahik: { id: 'mth-04', nama: 'Mbah Sinem', alamat: 'Jl. Jati No. 3', kategori_mustahik: { nama: 'Fakir' } }, tahun_zakat: { tahun_hijriah: '1447 H', tahun_masehi: 2026 } },
  { id: 'dst-05', mustahik_id: 'mth-05', tahun_zakat_id: 'tz-2026', jenis_distribusi: 'beras', jumlah: 10, tanggal_distribusi: '2026-03-28', status: 'selesai', catatan: null, created_at: '2026-03-28T08:40:00Z', updated_at: '2026-03-28T10:00:00Z', mustahik: { id: 'mth-05', nama: 'Pak Karyo', alamat: 'Jl. Bambu No. 9', kategori_mustahik: { nama: 'Fakir' } }, tahun_zakat: { tahun_hijriah: '1447 H', tahun_masehi: 2026 } },
  { id: 'dst-06', mustahik_id: 'mth-06', tahun_zakat_id: 'tz-2026', jenis_distribusi: 'beras', jumlah: 7.5, tanggal_distribusi: '2026-03-28', status: 'selesai', catatan: null, created_at: '2026-03-28T08:50:00Z', updated_at: '2026-03-28T10:00:00Z', mustahik: { id: 'mth-06', nama: 'Bu Parinem', alamat: 'Jl. Weru No. 11', kategori_mustahik: { nama: 'Fakir' } }, tahun_zakat: { tahun_hijriah: '1447 H', tahun_masehi: 2026 } },
  { id: 'dst-07', mustahik_id: 'mth-08', tahun_zakat_id: 'tz-2026', jenis_distribusi: 'beras', jumlah: 10, tanggal_distribusi: '2026-03-28', status: 'selesai', catatan: null, created_at: '2026-03-28T09:00:00Z', updated_at: '2026-03-28T10:00:00Z', mustahik: { id: 'mth-08', nama: 'Keluarga Triyono', alamat: 'Jl. Merak No. 8', kategori_mustahik: { nama: 'Miskin' } }, tahun_zakat: { tahun_hijriah: '1447 H', tahun_masehi: 2026 } },
  { id: 'dst-08', mustahik_id: 'mth-09', tahun_zakat_id: 'tz-2026', jenis_distribusi: 'beras', jumlah: 12.5, tanggal_distribusi: '2026-03-28', status: 'selesai', catatan: null, created_at: '2026-03-28T09:10:00Z', updated_at: '2026-03-28T10:00:00Z', mustahik: { id: 'mth-09', nama: 'Keluarga Hariyanto', alamat: 'Jl. Elang No. 15', kategori_mustahik: { nama: 'Miskin' } }, tahun_zakat: { tahun_hijriah: '1447 H', tahun_masehi: 2026 } },
  { id: 'dst-09', mustahik_id: 'mth-10', tahun_zakat_id: 'tz-2026', jenis_distribusi: 'beras', jumlah: 7.5, tanggal_distribusi: '2026-03-28', status: 'selesai', catatan: null, created_at: '2026-03-28T09:20:00Z', updated_at: '2026-03-28T10:00:00Z', mustahik: { id: 'mth-10', nama: 'Keluarga Supardi', alamat: 'Jl. Garuda No. 4', kategori_mustahik: { nama: 'Miskin' } }, tahun_zakat: { tahun_hijriah: '1447 H', tahun_masehi: 2026 } },
  { id: 'dst-10', mustahik_id: 'mth-11', tahun_zakat_id: 'tz-2026', jenis_distribusi: 'beras', jumlah: 15, tanggal_distribusi: '2026-03-28', status: 'selesai', catatan: null, created_at: '2026-03-28T09:30:00Z', updated_at: '2026-03-28T10:00:00Z', mustahik: { id: 'mth-11', nama: 'Keluarga Nugroho', alamat: 'Jl. Beo No. 19', kategori_mustahik: { nama: 'Miskin' } }, tahun_zakat: { tahun_hijriah: '1447 H', tahun_masehi: 2026 } },
  { id: 'dst-11', mustahik_id: 'mth-12', tahun_zakat_id: 'tz-2026', jenis_distribusi: 'beras', jumlah: 10, tanggal_distribusi: '2026-03-28', status: 'selesai', catatan: null, created_at: '2026-03-28T09:40:00Z', updated_at: '2026-03-28T10:00:00Z', mustahik: { id: 'mth-12', nama: 'Keluarga Suparno', alamat: 'Jl. Kutilang No. 22', kategori_mustahik: { nama: 'Miskin' } }, tahun_zakat: { tahun_hijriah: '1447 H', tahun_masehi: 2026 } },
  { id: 'dst-12', mustahik_id: 'mth-13', tahun_zakat_id: 'tz-2026', jenis_distribusi: 'beras', jumlah: 12.5, tanggal_distribusi: '2026-03-28', status: 'selesai', catatan: null, created_at: '2026-03-28T09:50:00Z', updated_at: '2026-03-28T10:00:00Z', mustahik: { id: 'mth-13', nama: 'Keluarga Wage', alamat: 'Jl. Walet No. 6', kategori_mustahik: { nama: 'Miskin' } }, tahun_zakat: { tahun_hijriah: '1447 H', tahun_masehi: 2026 } },
  // Distribusi beras pending
  { id: 'dst-13', mustahik_id: 'mth-32', tahun_zakat_id: 'tz-2026', jenis_distribusi: 'beras', jumlah: 5, tanggal_distribusi: '2026-03-29', status: 'pending', catatan: 'Konfirmasi penerimaan', created_at: '2026-03-29T08:00:00Z', updated_at: '2026-03-29T08:00:00Z', mustahik: { id: 'mth-32', nama: 'Bu Juminten', alamat: 'Jl. Nangka No. 6', kategori_mustahik: { nama: 'Fakir' } }, tahun_zakat: { tahun_hijriah: '1447 H', tahun_masehi: 2026 } },
  { id: 'dst-14', mustahik_id: 'mth-33', tahun_zakat_id: 'tz-2026', jenis_distribusi: 'beras', jumlah: 10, tanggal_distribusi: '2026-03-29', status: 'pending', catatan: null, created_at: '2026-03-29T08:10:00Z', updated_at: '2026-03-29T08:10:00Z', mustahik: { id: 'mth-33', nama: 'Pak Kasim', alamat: 'Jl. Kelengkeng No. 10', kategori_mustahik: { nama: 'Fakir' } }, tahun_zakat: { tahun_hijriah: '1447 H', tahun_masehi: 2026 } },
  // Distribusi uang (selesai)
  { id: 'dst-15', mustahik_id: 'mth-18', tahun_zakat_id: 'tz-2026', jenis_distribusi: 'uang', jumlah: 450000, tanggal_distribusi: '2026-03-29', status: 'selesai', catatan: 'Hak amil 3 orang × 150,000', created_at: '2026-03-29T09:00:00Z', updated_at: '2026-03-29T10:00:00Z', mustahik: { id: 'mth-18', nama: 'Panitia Zakat RT 01', alamat: 'Masjid Al-Fajar', kategori_mustahik: { nama: 'Amil' } }, tahun_zakat: { tahun_hijriah: '1447 H', tahun_masehi: 2026 } },
  { id: 'dst-16', mustahik_id: 'mth-19', tahun_zakat_id: 'tz-2026', jenis_distribusi: 'uang', jumlah: 450000, tanggal_distribusi: '2026-03-29', status: 'selesai', catatan: 'Hak amil RT 02', created_at: '2026-03-29T09:10:00Z', updated_at: '2026-03-29T10:00:00Z', mustahik: { id: 'mth-19', nama: 'Panitia Zakat RT 02', alamat: 'Masjid Al-Fajar', kategori_mustahik: { nama: 'Amil' } }, tahun_zakat: { tahun_hijriah: '1447 H', tahun_masehi: 2026 } },
  { id: 'dst-17', mustahik_id: 'mth-20', tahun_zakat_id: 'tz-2026', jenis_distribusi: 'uang', jumlah: 300000, tanggal_distribusi: '2026-03-29', status: 'selesai', catatan: 'Bantuan muallaf', created_at: '2026-03-29T09:20:00Z', updated_at: '2026-03-29T10:00:00Z', mustahik: { id: 'mth-20', nama: 'Bapak Kevin', alamat: 'Jl. Kersen No. 4', kategori_mustahik: { nama: 'Muallaf' } }, tahun_zakat: { tahun_hijriah: '1447 H', tahun_masehi: 2026 } },
  { id: 'dst-18', mustahik_id: 'mth-21', tahun_zakat_id: 'tz-2026', jenis_distribusi: 'uang', jumlah: 200000, tanggal_distribusi: '2026-03-29', status: 'selesai', catatan: 'Bantuan muallaf', created_at: '2026-03-29T09:30:00Z', updated_at: '2026-03-29T10:00:00Z', mustahik: { id: 'mth-21', nama: 'Ibu Rini', alamat: 'Jl. Jambu No. 12', kategori_mustahik: { nama: 'Muallaf' } }, tahun_zakat: { tahun_hijriah: '1447 H', tahun_masehi: 2026 } },
  { id: 'dst-19', mustahik_id: 'mth-22', tahun_zakat_id: 'tz-2026', jenis_distribusi: 'uang', jumlah: 100000, tanggal_distribusi: '2026-03-15', status: 'selesai', catatan: 'Bekal perjalanan ibnu sabil', created_at: '2026-03-15T14:00:00Z', updated_at: '2026-03-15T15:00:00Z', mustahik: { id: 'mth-22', nama: 'Pak Suryo (musafir)', alamat: '-', kategori_mustahik: { nama: 'Ibnu Sabil' } }, tahun_zakat: { tahun_hijriah: '1447 H', tahun_masehi: 2026 } },
  // Distribusi uang pending
  { id: 'dst-20', mustahik_id: 'mth-01', tahun_zakat_id: 'tz-2026', jenis_distribusi: 'uang', jumlah: 300000, tanggal_distribusi: '2026-03-30', status: 'pending', catatan: 'Bantuan fakir tambahan', created_at: '2026-03-30T08:00:00Z', updated_at: '2026-03-30T08:00:00Z', mustahik: { id: 'mth-01', nama: 'Pak Sarno', alamat: 'Jl. Kemuning No. 2', kategori_mustahik: { nama: 'Fakir' } }, tahun_zakat: { tahun_hijriah: '1447 H', tahun_masehi: 2026 } },
];

// ---------- Computed Stats ----------
// totalBerasKg from pembayaran: 265 kg (25 families)
// totalUangRp from pembayaran: 2,790,000 (15 families)
// infakSedekahBerasKg: 22.5 kg (pemasukan_beras)
// fidyahBerasKg: 2.5 kg
// totalPemasukanBerasKg: 265 + 22.5 + 2.5 = 290 kg
// fidyahUangRp: 225,000
// infakSedekahUangRp: 850,000
// maalPenghasilanUangRp: 2,500,000
// totalPemasukanUangRp: 2,790,000 + 225,000 + 850,000 + 2,500,000 = 6,365,000
// totalDistribusiBeras (selesai): 10+7.5+12.5+5+10+7.5+10+12.5+7.5+15+10+12.5 = 120 kg
// totalDistribusiUang (selesai): 450000+450000+300000+200000+100000 = 1,500,000
// totalMuzakki: 40 unique
// totalMustahikAktif: 33
// totalMustahikNonAktif: 3 (mth-07, mth-16, mth-31)
// sisaBerasKg: 265 - 120 = 145 kg
// sisaUangRp: 2,790,000 - 1,500,000 = 1,290,000
// hakAmilUangRp: 0 (distributed via distribusi, not separate hak_amil table)
// sisaUangAfterAmilRp: 6,365,000 - 0 - 1,500,000 = 4,865,000

export const OFFLINE_STATS_2026 = {
  totalBerasKg: 265,
  totalUangRp: 2790000,
  totalMuzakki: 40,
  totalMustahikAktif: 33,
  totalMustahikNonAktif: 3,
  totalDistribusiBerasKg: 120,
  totalDistribusiUangRp: 1500000,
  sisaBerasKg: 145,
  sisaUangRp: 1290000,
  fidyahUangRp: 225000,
  infakSedekahUangRp: 850000,
  maalPenghasilanUangRp: 2500000,
  totalPemasukanUangRp: 6365000,
  hakAmilUangRp: 0,
  sisaUangAfterAmilRp: 4865000,
  infakSedekahBerasKg: 22.5,
  fidyahBerasKg: 2.5,
  zakatFitrahBerasKg: 265,
  totalPemasukanBerasKg: 290,
};

export const OFFLINE_MONTHLY_2026 = [
  {
    month: '2026-02',
    zakatBerasKg: 0,
    fidyahBerasKg: 0,
    sedekahBerasKg: 0,
    zakatUangRp: 0,
    fidyahUangRp: 0,
    sedekahUangRp: 0,
    maalUangRp: 0,
  },
  {
    month: '2026-03',
    zakatBerasKg: 265,
    fidyahBerasKg: 2.5,
    sedekahBerasKg: 22.5,
    zakatUangRp: 2790000,
    fidyahUangRp: 225000,
    sedekahUangRp: 850000,
    maalUangRp: 2500000,
  },
];

// ---------- In-Memory Store ----------

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

class OfflineStore {
  tahunZakat: TahunZakat[] = [...TAHUN_ZAKAT_SEED];
  muzakki: Muzakki[] = [...MUZAKKI_SEED];
  pembayaran: PembayaranZakat[] = [...PEMBAYARAN_BERAS, ...PEMBAYARAN_UANG];
  pemasukanUang: PemasukanUang[] = [...PEMASUKAN_UANG_SEED];
  pemasukanBeras: PemasukanBeras[] = [...PEMASUKAN_BERAS_SEED];
  distribusi: Distribusi[] = [...DISTRIBUSI_SEED];
  mustahik: Mustahik[] = [...MUSTAHIK_SEED];
  kategoriMustahik: KategoriMustahik[] = [...KATEGORI_MUSTAHIK_SEED];

  // ---- Tahun Zakat ----
  getTahunZakatList(): TahunZakat[] {
    return [...this.tahunZakat].sort((a, b) => b.tahun_masehi - a.tahun_masehi);
  }
  getActiveTahunZakat(): TahunZakat | undefined {
    return this.tahunZakat.find((t) => t.is_active);
  }
  addTahunZakat(input: Omit<TahunZakat, 'id' | 'created_at' | 'updated_at'>): TahunZakat {
    if (input.is_active) {
      this.tahunZakat = this.tahunZakat.map((t) => ({ ...t, is_active: false }));
    }
    const newItem: TahunZakat = { ...input, id: makeId('tz'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    this.tahunZakat = [...this.tahunZakat, newItem];
    return newItem;
  }
  updateTahunZakat(id: string, input: Partial<TahunZakat>): TahunZakat {
    if (input.is_active) {
      this.tahunZakat = this.tahunZakat.map((t) => ({ ...t, is_active: false }));
    }
    this.tahunZakat = this.tahunZakat.map((t) => t.id === id ? { ...t, ...input, updated_at: new Date().toISOString() } : t);
    return this.tahunZakat.find((t) => t.id === id)!;
  }
  deleteTahunZakat(id: string) {
    this.tahunZakat = this.tahunZakat.filter((t) => t.id !== id);
  }

  // ---- Muzakki ----
  getMuzakkiAll(): Muzakki[] {
    return [...this.muzakki];
  }
  getMuzakkiById(id: string): Muzakki | undefined {
    return this.muzakki.find((m) => m.id === id);
  }
  addMuzakki(input: Omit<Muzakki, 'id'>): Muzakki {
    const item: Muzakki = { ...input, id: makeId('mzk') };
    this.muzakki = [...this.muzakki, item];
    return item;
  }

  // ---- Pembayaran ----
  getPembayaranList(params: {
    tahunZakatId?: string;
    search?: string;
    jenisZakat?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): { data: PembayaranZakat[]; count: number } {
    let items = [...this.pembayaran];
    if (params.tahunZakatId) items = items.filter((p) => p.tahun_zakat_id === params.tahunZakatId);
    if (params.jenisZakat && params.jenisZakat !== 'semua') items = items.filter((p) => p.jenis_zakat === params.jenisZakat);
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter((p) => p.muzakki.nama_kk.toLowerCase().includes(q) || p.muzakki.alamat.toLowerCase().includes(q));
    }
    // sort
    const sortBy = (params.sortBy || 'tanggal_bayar') as keyof PembayaranZakat;
    const asc = params.sortOrder === 'asc';
    items.sort((a, b) => {
      const av = String(a[sortBy] ?? '');
      const bv = String(b[sortBy] ?? '');
      return asc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    const count = items.length;
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    items = items.slice((page - 1) * pageSize, page * pageSize);
    return { data: items, count };
  }
  addPembayaran(input: Omit<PembayaranZakat, 'id' | 'created_at' | 'updated_at' | 'muzakki'>): PembayaranZakat {
    let mzk = this.muzakki.find((m) => m.id === input.muzakki_id);
    if (!mzk) {
      mzk = { id: input.muzakki_id, nama_kk: 'Unknown', alamat: '', no_telp: null };
    }
    const item: PembayaranZakat = { ...input, id: makeId('pbr'), muzakki: mzk, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    this.pembayaran = [...this.pembayaran, item];
    return item;
  }
  updatePembayaran(id: string, input: Partial<PembayaranZakat>): PembayaranZakat {
    this.pembayaran = this.pembayaran.map((p) => p.id === id ? { ...p, ...input, updated_at: new Date().toISOString() } : p);
    return this.pembayaran.find((p) => p.id === id)!;
  }
  deletePembayaran(id: string) {
    this.pembayaran = this.pembayaran.filter((p) => p.id !== id);
  }

  // ---- Pemasukan Uang ----
  getPemasukanUangList(params: {
    tahunZakatId?: string;
    kategori?: string;
    akun?: string;
    page?: number;
    pageSize?: number;
  }): { data: PemasukanUang[]; count: number } {
    let items = [...this.pemasukanUang];
    if (params.tahunZakatId) items = items.filter((p) => p.tahun_zakat_id === params.tahunZakatId);
    if (params.kategori && params.kategori !== 'semua') items = items.filter((p) => p.kategori === params.kategori);
    if (params.akun && params.akun !== 'semua') items = items.filter((p) => p.akun === params.akun);
    items.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    const count = items.length;
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    return { data: items.slice((page - 1) * pageSize, page * pageSize), count };
  }
  addPemasukanUang(input: { tahun_zakat_id: string; muzakki_id?: string; kategori: PemasukanUangKategori; akun: AkunUang; jumlah_uang_rp: number; tanggal: string; catatan?: string }): PemasukanUang {
    const mzk = input.muzakki_id ? this.muzakki.find((m) => m.id === input.muzakki_id) : null;
    const item: PemasukanUang = { id: makeId('pu'), tahun_zakat_id: input.tahun_zakat_id, muzakki_id: input.muzakki_id ?? null, muzakki: mzk ? { id: mzk.id, nama_kk: mzk.nama_kk } : null, kategori: input.kategori, akun: input.akun, jumlah_uang_rp: input.jumlah_uang_rp, tanggal: input.tanggal, catatan: input.catatan ?? null, created_by: 'mock-admin-001', created_at: new Date().toISOString() };
    this.pemasukanUang = [...this.pemasukanUang, item];
    return item;
  }
  updatePemasukanUang(id: string, input: Partial<PemasukanUang>): PemasukanUang {
    this.pemasukanUang = this.pemasukanUang.map((p) => p.id === id ? { ...p, ...input, updated_at: new Date().toISOString() } : p);
    return this.pemasukanUang.find((p) => p.id === id)!;
  }
  deletePemasukanUang(id: string) {
    this.pemasukanUang = this.pemasukanUang.filter((p) => p.id !== id);
  }

  // ---- Pemasukan Beras ----
  getPemasukanBerasList(params: {
    tahunZakatId?: string;
    kategori?: string;
    page?: number;
    pageSize?: number;
  }): { data: PemasukanBeras[]; count: number } {
    let items = [...this.pemasukanBeras];
    if (params.tahunZakatId) items = items.filter((p) => p.tahun_zakat_id === params.tahunZakatId);
    if (params.kategori && params.kategori !== 'semua') items = items.filter((p) => p.kategori === params.kategori);
    items.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    const count = items.length;
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    return { data: items.slice((page - 1) * pageSize, page * pageSize), count };
  }
  addPemasukanBeras(input: { tahun_zakat_id: string; muzakki_id?: string; kategori: PemasukanBerasKategori; jumlah_beras_kg: number; tanggal: string; catatan?: string }): PemasukanBeras {
    const mzk = input.muzakki_id ? this.muzakki.find((m) => m.id === input.muzakki_id) : null;
    const item: PemasukanBeras = { id: makeId('pmbr'), tahun_zakat_id: input.tahun_zakat_id, muzakki_id: input.muzakki_id ?? null, muzakki: mzk ? { id: mzk.id, nama_kk: mzk.nama_kk } : null, kategori: input.kategori, jumlah_beras_kg: input.jumlah_beras_kg, tanggal: input.tanggal, catatan: input.catatan ?? null, created_by: 'mock-admin-001', created_at: new Date().toISOString() };
    this.pemasukanBeras = [...this.pemasukanBeras, item];
    return item;
  }
  updatePemasukanBeras(id: string, input: Partial<PemasukanBeras>): PemasukanBeras {
    this.pemasukanBeras = this.pemasukanBeras.map((p) => p.id === id ? { ...p, ...input } : p);
    return this.pemasukanBeras.find((p) => p.id === id)!;
  }
  deletePemasukanBeras(id: string) {
    this.pemasukanBeras = this.pemasukanBeras.filter((p) => p.id !== id);
  }

  // ---- Mustahik ----
  getMustahikList(params: {
    search?: string;
    kategori_id?: string;
    status?: 'aktif' | 'non-aktif' | 'semua';
    page?: number;
    limit?: number;
  }): { data: Mustahik[]; count: number } {
    let items = [...this.mustahik];
    if (params.status === 'aktif') items = items.filter((m) => m.is_active);
    if (params.status === 'non-aktif') items = items.filter((m) => !m.is_active);
    if (params.kategori_id) items = items.filter((m) => m.kategori_id === params.kategori_id);
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter((m) => m.nama.toLowerCase().includes(q) || m.alamat.toLowerCase().includes(q));
    }
    items.sort((a, b) => b.created_at.localeCompare(a.created_at));
    const count = items.length;
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    return { data: items.slice((page - 1) * limit, page * limit), count };
  }
  getMustahikById(id: string): Mustahik | undefined {
    return this.mustahik.find((m) => m.id === id);
  }
  addMustahik(input: Omit<Mustahik, 'id' | 'created_at' | 'updated_at' | 'kategori_mustahik' | 'has_received'>): Mustahik {
    const kat = this.kategoriMustahik.find((k) => k.id === input.kategori_id);
    const item: Mustahik = { ...input, id: makeId('mth'), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), kategori_mustahik: kat };
    this.mustahik = [...this.mustahik, item];
    return item;
  }
  updateMustahik(id: string, input: Partial<Mustahik>): Mustahik {
    this.mustahik = this.mustahik.map((m) => m.id === id ? { ...m, ...input, updated_at: new Date().toISOString() } : m);
    return this.mustahik.find((m) => m.id === id)!;
  }
  deleteMustahik(id: string) {
    this.mustahik = this.mustahik.filter((m) => m.id !== id);
  }
  getKategoriMustahikList(): KategoriMustahik[] {
    return [...this.kategoriMustahik];
  }

  // ---- Distribusi ----
  getDistribusiList(params: {
    tahun_zakat_id?: string;
    jenis_distribusi?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): { data: Distribusi[]; count: number } {
    let items = [...this.distribusi];
    if (params.tahun_zakat_id) items = items.filter((d) => d.tahun_zakat_id === params.tahun_zakat_id);
    if (params.jenis_distribusi && params.jenis_distribusi !== 'semua') items = items.filter((d) => d.jenis_distribusi === params.jenis_distribusi);
    if (params.status && params.status !== 'semua') items = items.filter((d) => d.status === params.status);
    items.sort((a, b) => b.tanggal_distribusi.localeCompare(a.tanggal_distribusi));
    const count = items.length;
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    return { data: items.slice((page - 1) * limit, page * limit), count };
  }
  getDistribusiById(id: string): Distribusi | undefined {
    return this.distribusi.find((d) => d.id === id);
  }
  getStokSummary(tahunZakatId: string) {
    const pemasukanBeras = this.pemasukanBeras.filter((p) => p.tahun_zakat_id === tahunZakatId).reduce((s, p) => s + p.jumlah_beras_kg, 0);
    const pemasukanUang = this.pemasukanUang.filter((p) => p.tahun_zakat_id === tahunZakatId).reduce((s, p) => s + p.jumlah_uang_rp, 0);
    const pembayaranBeras = this.pembayaran.filter((p) => p.tahun_zakat_id === tahunZakatId && p.jenis_zakat === 'beras').reduce((s, p) => s + (p.jumlah_beras_kg ?? 0), 0);
    const pembayaranUang = this.pembayaran.filter((p) => p.tahun_zakat_id === tahunZakatId && p.jenis_zakat === 'uang').reduce((s, p) => s + (p.jumlah_uang_rp ?? 0), 0);
    const distBeras = this.distribusi.filter((d) => d.tahun_zakat_id === tahunZakatId && d.jenis_distribusi === 'beras' && d.status === 'selesai').reduce((s, d) => s + d.jumlah, 0);
    const distUang = this.distribusi.filter((d) => d.tahun_zakat_id === tahunZakatId && d.jenis_distribusi === 'uang' && d.status === 'selesai').reduce((s, d) => s + d.jumlah, 0);
    const totalBeras = pembayaranBeras + pemasukanBeras;
    const totalUang = pembayaranUang + pemasukanUang;
    return { total_pemasukan_beras: totalBeras, total_pemasukan_uang: totalUang, total_distribusi_beras: distBeras, total_distribusi_uang: distUang, sisa_beras: totalBeras - distBeras, sisa_uang: totalUang - distUang };
  }
  addDistribusi(input: Omit<Distribusi, 'id' | 'created_at' | 'updated_at' | 'mustahik' | 'tahun_zakat'>): Distribusi {
    const mth = this.mustahik.find((m) => m.id === input.mustahik_id);
    const tz = this.tahunZakat.find((t) => t.id === input.tahun_zakat_id);
    const item: Distribusi = { ...input, id: makeId('dst'), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), mustahik: mth ? { id: mth.id, nama: mth.nama, alamat: mth.alamat, kategori_mustahik: mth.kategori_mustahik ? { nama: mth.kategori_mustahik.nama } : undefined } : undefined, tahun_zakat: tz ? { tahun_hijriah: tz.tahun_hijriah, tahun_masehi: tz.tahun_masehi } : undefined };
    this.distribusi = [...this.distribusi, item];
    return item;
  }
  updateDistribusiStatus(id: string, status: 'pending' | 'selesai'): Distribusi {
    this.distribusi = this.distribusi.map((d) => d.id === id ? { ...d, status, updated_at: new Date().toISOString() } : d);
    return this.distribusi.find((d) => d.id === id)!;
  }
  deleteDistribusi(id: string) {
    this.distribusi = this.distribusi.filter((d) => d.id !== id);
  }
}

/** Singleton offline store instance */
export const offlineStore = new OfflineStore();
