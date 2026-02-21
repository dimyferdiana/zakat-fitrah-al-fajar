export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'petugas';

export type JenisZakat = 'beras' | 'uang';

export type AkunUang = 'kas' | 'bank';

export type PemasukanUangKategori =
  | 'zakat_fitrah_uang'
  | 'fidyah_uang'
  | 'maal_penghasilan_uang'
  | 'infak_sedekah_uang';

export type PemasukanBerasKategori =
  | 'fidyah_beras'
  | 'infak_sedekah_beras'
  | 'zakat_fitrah_beras'
  | 'maal_beras';

export type StatusDistribusi = 'pending' | 'selesai';

export type HakAmilBasisMode = 'net_after_reconciliation' | 'gross_before_reconciliation';

export type HakAmilKategori = 'zakat_fitrah' | 'zakat_maal' | 'infak' | 'fidyah' | 'beras';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          nama_lengkap: string;
          email: string;
          role: UserRole;
          is_active: boolean;
          address: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nama_lengkap: string;
          email: string;
          role?: UserRole;
          is_active?: boolean;
          address?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nama_lengkap?: string;
          email?: string;
          address?: string | null;
          phone?: string | null;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_invitations: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          token_hash: string;
          expires_at: string;
          used_at: string | null;
          revoked_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role: UserRole;
          token_hash: string;
          expires_at: string;
          used_at?: string | null;
          revoked_at?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: UserRole;
          token_hash?: string;
          expires_at?: string;
          used_at?: string | null;
          revoked_at?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      tahun_zakat: {
        Row: {
          id: string;
          tahun_hijriah: string;
          tahun_masehi: number;
          nilai_beras_kg: number;
          nilai_uang_rp: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tahun_hijriah: string;
          tahun_masehi: number;
          nilai_beras_kg: number;
          nilai_uang_rp: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tahun_hijriah?: string;
          tahun_masehi?: number;
          nilai_beras_kg?: number;
          nilai_uang_rp?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      kategori_mustahik: {
        Row: {
          id: string;
          nama: string;
          deskripsi: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nama: string;
          deskripsi?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nama?: string;
          deskripsi?: string | null;
          created_at?: string;
        };
      };
      muzakki: {
        Row: {
          id: string;
          nama_kk: string;
          alamat: string;
          no_telp: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nama_kk: string;
          alamat: string;
          no_telp?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nama_kk?: string;
          alamat?: string;
          no_telp?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bukti_sedekah: {
        Row: {
          id: string;
          receipt_number: string;
          category: string;
          category_key: string;
          donor_id: string | null;
          donor_name: string;
          donor_address: string;
          donor_phone: string | null;
          amount: number;
          tanggal: string;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          receipt_number: string;
          category: string;
          category_key: string;
          donor_id?: string | null;
          donor_name: string;
          donor_address: string;
          donor_phone?: string | null;
          amount: number;
          tanggal?: string;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          receipt_number?: string;
          category?: string;
          category_key?: string;
          donor_id?: string | null;
          donor_name?: string;
          donor_address?: string;
          donor_phone?: string | null;
          amount?: number;
          tanggal?: string;
          notes?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      pembayaran_zakat: {
        Row: {
          id: string;
          muzakki_id: string;
          tahun_zakat_id: string;
          jumlah_jiwa: number;
          jenis_zakat: JenisZakat;
          /** For beras: actual kg received (must meet minimum). For uang: not used, see jumlah_uang_rp */
          jumlah_beras_kg: number | null;
          /** For uang: actual amount received (not calculated kewajiban). For beras: not used. */
          jumlah_uang_rp: number | null;
          akun_uang: AkunUang | null;
          /** @deprecated Use jumlah_uang_rp instead. Kept for historical compatibility only. */
          jumlah_uang_dibayar_rp: number | null;
          tanggal_bayar: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          muzakki_id: string;
          tahun_zakat_id: string;
          jumlah_jiwa: number;
          jenis_zakat: JenisZakat;
          jumlah_beras_kg?: number | null;
          jumlah_uang_rp?: number | null;
          akun_uang?: AkunUang | null;
          jumlah_uang_dibayar_rp?: number | null;
          tanggal_bayar?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          muzakki_id?: string;
          tahun_zakat_id?: string;
          jumlah_jiwa?: number;
          jenis_zakat?: JenisZakat;
          jumlah_beras_kg?: number | null;
          jumlah_uang_rp?: number | null;
          akun_uang?: AkunUang | null;
          jumlah_uang_dibayar_rp?: number | null;
          tanggal_bayar?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      pemasukan_uang: {
        Row: {
          id: string;
          tahun_zakat_id: string;
          muzakki_id: string | null;
          kategori: PemasukanUangKategori;
          akun: AkunUang;
          jumlah_uang_rp: number;
          tanggal: string;
          catatan: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tahun_zakat_id: string;
          muzakki_id?: string | null;
          kategori: PemasukanUangKategori;
          akun: AkunUang;
          jumlah_uang_rp: number;
          tanggal?: string;
          catatan?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tahun_zakat_id?: string;
          muzakki_id?: string | null;
          kategori?: PemasukanUangKategori;
          akun?: AkunUang;
          jumlah_uang_rp?: number;
          tanggal?: string;
          catatan?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      pemasukan_beras: {
        Row: {
          id: string;
          tahun_zakat_id: string;
          muzakki_id: string | null;
          kategori: PemasukanBerasKategori;
          jumlah_beras_kg: number;
          tanggal: string;
          catatan: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tahun_zakat_id: string;
          muzakki_id?: string | null;
          kategori: PemasukanBerasKategori;
          jumlah_beras_kg: number;
          tanggal?: string;
          catatan?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tahun_zakat_id?: string;
          muzakki_id?: string | null;
          kategori?: PemasukanBerasKategori;
          jumlah_beras_kg?: number;
          tanggal?: string;
          catatan?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      hak_amil: {
        Row: {
          tahun_zakat_id: string;
          jumlah_uang_rp: number;
          updated_by: string | null;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          tahun_zakat_id: string;
          jumlah_uang_rp?: number;
          updated_by?: string | null;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          tahun_zakat_id?: string;
          jumlah_uang_rp?: number;
          updated_by?: string | null;
          updated_at?: string;
          created_at?: string;
        };
      };
      hak_amil_configs: {
        Row: {
          id: string;
          tahun_zakat_id: string;
          basis_mode: HakAmilBasisMode;
          persen_zakat_fitrah: number;
          persen_zakat_maal: number;
          persen_infak: number;
          persen_fidyah: number;
          persen_beras: number;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tahun_zakat_id: string;
          basis_mode?: HakAmilBasisMode;
          persen_zakat_fitrah?: number;
          persen_zakat_maal?: number;
          persen_infak?: number;
          persen_fidyah?: number;
          persen_beras?: number;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tahun_zakat_id?: string;
          basis_mode?: HakAmilBasisMode;
          persen_zakat_fitrah?: number;
          persen_zakat_maal?: number;
          persen_infak?: number;
          persen_fidyah?: number;
          persen_beras?: number;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      hak_amil_snapshots: {
        Row: {
          id: string;
          tahun_zakat_id: string;
          kategori: HakAmilKategori;
          tanggal: string;
          basis_mode: HakAmilBasisMode;
          pembayaran_zakat_id: string | null;
          pemasukan_uang_id: string | null;
          pemasukan_beras_id: string | null;
          rekonsiliasi_id: string | null;
          total_bruto: number;
          total_rekonsiliasi: number;
          total_neto: number;
          nominal_basis: number;
          persen_hak_amil: number;
          nominal_hak_amil: number;
          catatan: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tahun_zakat_id: string;
          kategori: HakAmilKategori;
          tanggal?: string;
          basis_mode: HakAmilBasisMode;
          pembayaran_zakat_id?: string | null;
          pemasukan_uang_id?: string | null;
          pemasukan_beras_id?: string | null;
          rekonsiliasi_id?: string | null;
          total_bruto?: number;
          total_rekonsiliasi?: number;
          total_neto?: number;
          nominal_basis?: number;
          persen_hak_amil: number;
          nominal_hak_amil: number;
          catatan?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tahun_zakat_id?: string;
          kategori?: HakAmilKategori;
          tanggal?: string;
          basis_mode?: HakAmilBasisMode;
          pembayaran_zakat_id?: string | null;
          pemasukan_uang_id?: string | null;
          pemasukan_beras_id?: string | null;
          rekonsiliasi_id?: string | null;
          total_bruto?: number;
          total_rekonsiliasi?: number;
          total_neto?: number;
          nominal_basis?: number;
          persen_hak_amil?: number;
          nominal_hak_amil?: number;
          catatan?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      rekonsiliasi: {
        Row: {
          id: string;
          tahun_zakat_id: string;
          jenis: JenisZakat;
          akun: AkunUang | null;
          jumlah_uang_rp: number | null;
          jumlah_beras_kg: number | null;
          tanggal: string;
          catatan: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tahun_zakat_id: string;
          jenis: JenisZakat;
          akun?: AkunUang | null;
          jumlah_uang_rp?: number | null;
          jumlah_beras_kg?: number | null;
          tanggal?: string;
          catatan: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tahun_zakat_id?: string;
          jenis?: JenisZakat;
          akun?: AkunUang | null;
          jumlah_uang_rp?: number | null;
          jumlah_beras_kg?: number | null;
          tanggal?: string;
          catatan?: string;
          created_by?: string;
          created_at?: string;
        };
      };
      mustahik: {
        Row: {
          id: string;
          nama: string;
          alamat: string;
          kategori_id: string;
          jumlah_anggota: number;
          no_telp: string | null;
          catatan: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nama: string;
          alamat: string;
          kategori_id: string;
          jumlah_anggota: number;
          no_telp?: string | null;
          catatan?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nama?: string;
          alamat?: string;
          kategori_id?: string;
          jumlah_anggota?: number;
          no_telp?: string | null;
          catatan?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      distribusi_zakat: {
        Row: {
          id: string;
          mustahik_id: string;
          tahun_zakat_id: string;
          jenis_distribusi: JenisZakat;
          jumlah_beras_kg: number | null;
          jumlah_uang_rp: number | null;
          tanggal_distribusi: string;
          status: StatusDistribusi;
          catatan: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mustahik_id: string;
          tahun_zakat_id: string;
          jenis_distribusi: JenisZakat;
          jumlah_beras_kg?: number | null;
          jumlah_uang_rp?: number | null;
          tanggal_distribusi?: string;
          status?: StatusDistribusi;
          catatan?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          mustahik_id?: string;
          tahun_zakat_id?: string;
          jenis_distribusi?: JenisZakat;
          jumlah_beras_kg?: number | null;
          jumlah_uang_rp?: number | null;
          tanggal_distribusi?: string;
          status?: StatusDistribusi;
          catatan?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          table_name: string;
          record_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          table_name: string;
          record_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          table_name?: string;
          record_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          created_at?: string;
        };
      };
      bulk_submission_logs: {
        Row: {
          id: string;
          operator_id: string;
          tahun_zakat_id: string;
          receipt_no: string;
          row_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          operator_id: string;
          tahun_zakat_id: string;
          receipt_no: string;
          row_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          operator_id?: string;
          tahun_zakat_id?: string;
          receipt_no?: string;
          row_count?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      next_bukti_sedekah_number: {
        Args: {
          p_category_key: string;
        };
        Returns: string;
      };
      peek_bukti_sedekah_number: {
        Args: {
          p_category_key: string;
        };
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      jenis_zakat: JenisZakat;
      status_distribusi: StatusDistribusi;
      akun_uang: AkunUang;
      pemasukan_uang_kategori: PemasukanUangKategori;
      pemasukan_beras_kategori: PemasukanBerasKategori;
      hak_amil_basis_mode: HakAmilBasisMode;
      hak_amil_kategori: HakAmilKategori;
    };
  };
}

export type User = Database['public']['Tables']['users']['Row'];
export type UserInvitation = Database['public']['Tables']['user_invitations']['Row'];
export type TahunZakat = Database['public']['Tables']['tahun_zakat']['Row'];
export type KategoriMustahik = Database['public']['Tables']['kategori_mustahik']['Row'];
export type Muzakki = Database['public']['Tables']['muzakki']['Row'];
export type PembayaranZakat = Database['public']['Tables']['pembayaran_zakat']['Row'];
export type PemasukanUang = Database['public']['Tables']['pemasukan_uang']['Row'];
export type PemasukanBeras = Database['public']['Tables']['pemasukan_beras']['Row'];
export type HakAmil = Database['public']['Tables']['hak_amil']['Row'];
export type HakAmilConfig = Database['public']['Tables']['hak_amil_configs']['Row'];
export type HakAmilSnapshot = Database['public']['Tables']['hak_amil_snapshots']['Row'];
export type Rekonsiliasi = Database['public']['Tables']['rekonsiliasi']['Row'];
export type Mustahik = Database['public']['Tables']['mustahik']['Row'];
export type DistribusiZakat = Database['public']['Tables']['distribusi_zakat']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type BulkSubmissionLog = Database['public']['Tables']['bulk_submission_logs']['Row'];

// Helper types for invitation status
export type InvitationStatus = 'pending' | 'used' | 'expired' | 'revoked';
