export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      account_ledger_entries: {
        Row: {
          account_id: string
          amount_rp: number
          created_at: string
          created_by: string | null
          effective_at: string
          entry_date: string
          entry_type: Database["public"]["Enums"]["account_ledger_entry_type"]
          id: string
          manual_reconciliation_ref: string | null
          notes: string | null
          reference_no: string | null
          running_balance_after_rp: number
          running_balance_before_rp: number
          source_pemasukan_beras_id: string | null
          source_pemasukan_uang_id: string | null
          source_pembayaran_zakat_id: string | null
          source_rekonsiliasi_id: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          amount_rp: number
          created_at?: string
          created_by?: string | null
          effective_at?: string
          entry_date?: string
          entry_type: Database["public"]["Enums"]["account_ledger_entry_type"]
          id?: string
          manual_reconciliation_ref?: string | null
          notes?: string | null
          reference_no?: string | null
          running_balance_after_rp?: number
          running_balance_before_rp?: number
          source_pemasukan_beras_id?: string | null
          source_pemasukan_uang_id?: string | null
          source_pembayaran_zakat_id?: string | null
          source_rekonsiliasi_id?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount_rp?: number
          created_at?: string
          created_by?: string | null
          effective_at?: string
          entry_date?: string
          entry_type?: Database["public"]["Enums"]["account_ledger_entry_type"]
          id?: string
          manual_reconciliation_ref?: string | null
          notes?: string | null
          reference_no?: string | null
          running_balance_after_rp?: number
          running_balance_before_rp?: number
          source_pemasukan_beras_id?: string | null
          source_pemasukan_uang_id?: string | null
          source_pembayaran_zakat_id?: string | null
          source_rekonsiliasi_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_ledger_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_ledger_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_ledger_entries_source_pemasukan_beras_id_fkey"
            columns: ["source_pemasukan_beras_id"]
            isOneToOne: false
            referencedRelation: "pemasukan_beras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_ledger_entries_source_pemasukan_uang_id_fkey"
            columns: ["source_pemasukan_uang_id"]
            isOneToOne: false
            referencedRelation: "pemasukan_uang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_ledger_entries_source_pembayaran_zakat_id_fkey"
            columns: ["source_pembayaran_zakat_id"]
            isOneToOne: false
            referencedRelation: "pembayaran_zakat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_ledger_entries_source_rekonsiliasi_id_fkey"
            columns: ["source_rekonsiliasi_id"]
            isOneToOne: false
            referencedRelation: "rekonsiliasi"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          account_channel: Database["public"]["Enums"]["account_channel"]
          account_name: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          metadata: Json
          sort_order: number
          updated_at: string
        }
        Insert: {
          account_channel: Database["public"]["Enums"]["account_channel"]
          account_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          sort_order?: number
          updated_at?: string
        }
        Update: {
          account_channel?: Database["public"]["Enums"]["account_channel"]
          account_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          new_values: Json | null
          old_data: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          new_values?: Json | null
          old_data?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          new_values?: Json | null
          old_data?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bukti_sedekah: {
        Row: {
          amount: number
          category: string
          category_key: string
          created_at: string
          created_by: string
          donor_address: string
          donor_id: string | null
          donor_name: string
          donor_phone: string | null
          id: string
          notes: string | null
          receipt_number: string
          tanggal: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          category_key: string
          created_at?: string
          created_by: string
          donor_address: string
          donor_id?: string | null
          donor_name: string
          donor_phone?: string | null
          id?: string
          notes?: string | null
          receipt_number: string
          tanggal?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          category_key?: string
          created_at?: string
          created_by?: string
          donor_address?: string
          donor_id?: string | null
          donor_name?: string
          donor_phone?: string | null
          id?: string
          notes?: string | null
          receipt_number?: string
          tanggal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bukti_sedekah_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bukti_sedekah_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "muzakki"
            referencedColumns: ["id"]
          },
        ]
      }
      bukti_sedekah_counters: {
        Row: {
          category_key: string
          last_number: number
          updated_at: string
        }
        Insert: {
          category_key: string
          last_number?: number
          updated_at?: string
        }
        Update: {
          category_key?: string
          last_number?: number
          updated_at?: string
        }
        Relationships: []
      }
      bulk_submission_logs: {
        Row: {
          created_at: string
          id: string
          operator_id: string
          receipt_no: string
          row_count: number
          tahun_zakat_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          operator_id: string
          receipt_no: string
          row_count?: number
          tahun_zakat_id: string
        }
        Update: {
          created_at?: string
          id?: string
          operator_id?: string
          receipt_no?: string
          row_count?: number
          tahun_zakat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_submission_logs_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_submission_logs_tahun_zakat_id_fkey"
            columns: ["tahun_zakat_id"]
            isOneToOne: false
            referencedRelation: "tahun_zakat"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_configs: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          sort_order: number
          stat_card_columns: number
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          sort_order?: number
          stat_card_columns?: number
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          sort_order?: number
          stat_card_columns?: number
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      dashboard_widgets: {
        Row: {
          config: Json
          created_at: string
          dashboard_id: string
          id: string
          sort_order: number
          updated_at: string
          widget_type: string
          width: string
        }
        Insert: {
          config?: Json
          created_at?: string
          dashboard_id: string
          id?: string
          sort_order?: number
          updated_at?: string
          widget_type: string
          width?: string
        }
        Update: {
          config?: Json
          created_at?: string
          dashboard_id?: string
          id?: string
          sort_order?: number
          updated_at?: string
          widget_type?: string
          width?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_widgets_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "dashboard_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      distribusi_zakat: {
        Row: {
          catatan: string | null
          created_at: string | null
          created_by: string | null
          id: string
          jenis_distribusi: string
          jumlah: number
          jumlah_beras_kg: number | null
          jumlah_uang_rp: number | null
          mustahik_id: string
          petugas_distribusi: string
          status: string | null
          tag_id: string | null
          tahun_zakat_id: string
          tanggal_distribusi: string
          updated_at: string | null
        }
        Insert: {
          catatan?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          jenis_distribusi: string
          jumlah: number
          jumlah_beras_kg?: number | null
          jumlah_uang_rp?: number | null
          mustahik_id: string
          petugas_distribusi: string
          status?: string | null
          tag_id?: string | null
          tahun_zakat_id: string
          tanggal_distribusi?: string
          updated_at?: string | null
        }
        Update: {
          catatan?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          jenis_distribusi?: string
          jumlah?: number
          jumlah_beras_kg?: number | null
          jumlah_uang_rp?: number | null
          mustahik_id?: string
          petugas_distribusi?: string
          status?: string | null
          tag_id?: string | null
          tahun_zakat_id?: string
          tanggal_distribusi?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distribusi_zakat_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribusi_zakat_mustahik_id_fkey"
            columns: ["mustahik_id"]
            isOneToOne: false
            referencedRelation: "mustahik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribusi_zakat_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "transaction_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribusi_zakat_tahun_zakat_id_fkey"
            columns: ["tahun_zakat_id"]
            isOneToOne: false
            referencedRelation: "tahun_zakat"
            referencedColumns: ["id"]
          },
        ]
      }
      hak_amil: {
        Row: {
          created_at: string
          jumlah_uang_rp: number
          tahun_zakat_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          jumlah_uang_rp?: number
          tahun_zakat_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          jumlah_uang_rp?: number
          tahun_zakat_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hak_amil_tahun_zakat_id_fkey"
            columns: ["tahun_zakat_id"]
            isOneToOne: true
            referencedRelation: "tahun_zakat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hak_amil_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hak_amil_configs: {
        Row: {
          basis_mode: Database["public"]["Enums"]["hak_amil_basis_mode"]
          created_at: string
          created_by: string | null
          id: string
          persen_beras: number
          persen_fidyah: number
          persen_infak: number
          persen_zakat_fitrah: number
          persen_zakat_maal: number
          tahun_zakat_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          basis_mode?: Database["public"]["Enums"]["hak_amil_basis_mode"]
          created_at?: string
          created_by?: string | null
          id?: string
          persen_beras?: number
          persen_fidyah?: number
          persen_infak?: number
          persen_zakat_fitrah?: number
          persen_zakat_maal?: number
          tahun_zakat_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          basis_mode?: Database["public"]["Enums"]["hak_amil_basis_mode"]
          created_at?: string
          created_by?: string | null
          id?: string
          persen_beras?: number
          persen_fidyah?: number
          persen_infak?: number
          persen_zakat_fitrah?: number
          persen_zakat_maal?: number
          tahun_zakat_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hak_amil_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hak_amil_configs_tahun_zakat_id_fkey"
            columns: ["tahun_zakat_id"]
            isOneToOne: true
            referencedRelation: "tahun_zakat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hak_amil_configs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hak_amil_snapshots: {
        Row: {
          basis_mode: Database["public"]["Enums"]["hak_amil_basis_mode"]
          catatan: string | null
          created_at: string
          created_by: string | null
          id: string
          kategori: Database["public"]["Enums"]["hak_amil_kategori"]
          nominal_basis: number
          nominal_hak_amil: number
          pemasukan_beras_id: string | null
          pemasukan_uang_id: string | null
          pembayaran_zakat_id: string | null
          persen_hak_amil: number
          rekonsiliasi_id: string | null
          tahun_zakat_id: string
          tanggal: string
          total_bruto: number
          total_neto: number
          total_rekonsiliasi: number
        }
        Insert: {
          basis_mode: Database["public"]["Enums"]["hak_amil_basis_mode"]
          catatan?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kategori: Database["public"]["Enums"]["hak_amil_kategori"]
          nominal_basis?: number
          nominal_hak_amil: number
          pemasukan_beras_id?: string | null
          pemasukan_uang_id?: string | null
          pembayaran_zakat_id?: string | null
          persen_hak_amil: number
          rekonsiliasi_id?: string | null
          tahun_zakat_id: string
          tanggal?: string
          total_bruto?: number
          total_neto?: number
          total_rekonsiliasi?: number
        }
        Update: {
          basis_mode?: Database["public"]["Enums"]["hak_amil_basis_mode"]
          catatan?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kategori?: Database["public"]["Enums"]["hak_amil_kategori"]
          nominal_basis?: number
          nominal_hak_amil?: number
          pemasukan_beras_id?: string | null
          pemasukan_uang_id?: string | null
          pembayaran_zakat_id?: string | null
          persen_hak_amil?: number
          rekonsiliasi_id?: string | null
          tahun_zakat_id?: string
          tanggal?: string
          total_bruto?: number
          total_neto?: number
          total_rekonsiliasi?: number
        }
        Relationships: [
          {
            foreignKeyName: "hak_amil_snapshots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hak_amil_snapshots_pemasukan_beras_id_fkey"
            columns: ["pemasukan_beras_id"]
            isOneToOne: false
            referencedRelation: "pemasukan_beras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hak_amil_snapshots_pemasukan_uang_id_fkey"
            columns: ["pemasukan_uang_id"]
            isOneToOne: false
            referencedRelation: "pemasukan_uang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hak_amil_snapshots_pembayaran_zakat_id_fkey"
            columns: ["pembayaran_zakat_id"]
            isOneToOne: false
            referencedRelation: "pembayaran_zakat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hak_amil_snapshots_rekonsiliasi_id_fkey"
            columns: ["rekonsiliasi_id"]
            isOneToOne: false
            referencedRelation: "rekonsiliasi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hak_amil_snapshots_tahun_zakat_id_fkey"
            columns: ["tahun_zakat_id"]
            isOneToOne: false
            referencedRelation: "tahun_zakat"
            referencedColumns: ["id"]
          },
        ]
      }
      kategori_mustahik: {
        Row: {
          created_at: string | null
          deskripsi: string | null
          id: string
          nama: string
          urutan: number | null
        }
        Insert: {
          created_at?: string | null
          deskripsi?: string | null
          id?: string
          nama: string
          urutan?: number | null
        }
        Update: {
          created_at?: string | null
          deskripsi?: string | null
          id?: string
          nama?: string
          urutan?: number | null
        }
        Relationships: []
      }
      mustahik: {
        Row: {
          alamat: string
          catatan: string | null
          created_at: string | null
          created_by: string | null
          data_lama_tahun: number | null
          id: string
          is_active: boolean | null
          is_data_lama: boolean | null
          jumlah_anggota: number
          kategori_id: string
          nama: string
          no_telp: string | null
          updated_at: string | null
        }
        Insert: {
          alamat: string
          catatan?: string | null
          created_at?: string | null
          created_by?: string | null
          data_lama_tahun?: number | null
          id?: string
          is_active?: boolean | null
          is_data_lama?: boolean | null
          jumlah_anggota?: number
          kategori_id: string
          nama: string
          no_telp?: string | null
          updated_at?: string | null
        }
        Update: {
          alamat?: string
          catatan?: string | null
          created_at?: string | null
          created_by?: string | null
          data_lama_tahun?: number | null
          id?: string
          is_active?: boolean | null
          is_data_lama?: boolean | null
          jumlah_anggota?: number
          kategori_id?: string
          nama?: string
          no_telp?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mustahik_kategori_mustahik_id_fkey"
            columns: ["kategori_id"]
            isOneToOne: false
            referencedRelation: "kategori_mustahik"
            referencedColumns: ["id"]
          },
        ]
      }
      muzakki: {
        Row: {
          alamat: string
          created_at: string | null
          created_by: string | null
          id: string
          nama_kk: string
          no_telp: string | null
          updated_at: string | null
        }
        Insert: {
          alamat: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          nama_kk: string
          no_telp?: string | null
          updated_at?: string | null
        }
        Update: {
          alamat?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          nama_kk?: string
          no_telp?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pemasukan_beras: {
        Row: {
          account_id: string | null
          bukti_bayar_url: string | null
          catatan: string | null
          created_at: string
          created_by: string
          id: string
          jumlah_beras_kg: number
          kategori: Database["public"]["Enums"]["pemasukan_beras_kategori"]
          muzakki_id: string | null
          tag_id: string | null
          tahun_zakat_id: string
          tanggal: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          bukti_bayar_url?: string | null
          catatan?: string | null
          created_at?: string
          created_by: string
          id?: string
          jumlah_beras_kg: number
          kategori: Database["public"]["Enums"]["pemasukan_beras_kategori"]
          muzakki_id?: string | null
          tag_id?: string | null
          tahun_zakat_id: string
          tanggal?: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          bukti_bayar_url?: string | null
          catatan?: string | null
          created_at?: string
          created_by?: string
          id?: string
          jumlah_beras_kg?: number
          kategori?: Database["public"]["Enums"]["pemasukan_beras_kategori"]
          muzakki_id?: string | null
          tag_id?: string | null
          tahun_zakat_id?: string
          tanggal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pemasukan_beras_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pemasukan_beras_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pemasukan_beras_muzakki_id_fkey"
            columns: ["muzakki_id"]
            isOneToOne: false
            referencedRelation: "muzakki"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pemasukan_beras_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "transaction_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pemasukan_beras_tahun_zakat_id_fkey"
            columns: ["tahun_zakat_id"]
            isOneToOne: false
            referencedRelation: "tahun_zakat"
            referencedColumns: ["id"]
          },
        ]
      }
      pemasukan_uang: {
        Row: {
          account_id: string | null
          akun: Database["public"]["Enums"]["akun_uang"]
          bukti_bayar_url: string | null
          catatan: string | null
          created_at: string
          created_by: string
          id: string
          jumlah_uang_rp: number
          kategori: Database["public"]["Enums"]["pemasukan_uang_kategori"]
          muzakki_id: string | null
          tag_id: string | null
          tahun_zakat_id: string
          tanggal: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          akun: Database["public"]["Enums"]["akun_uang"]
          bukti_bayar_url?: string | null
          catatan?: string | null
          created_at?: string
          created_by: string
          id?: string
          jumlah_uang_rp: number
          kategori: Database["public"]["Enums"]["pemasukan_uang_kategori"]
          muzakki_id?: string | null
          tag_id?: string | null
          tahun_zakat_id: string
          tanggal?: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          akun?: Database["public"]["Enums"]["akun_uang"]
          bukti_bayar_url?: string | null
          catatan?: string | null
          created_at?: string
          created_by?: string
          id?: string
          jumlah_uang_rp?: number
          kategori?: Database["public"]["Enums"]["pemasukan_uang_kategori"]
          muzakki_id?: string | null
          tag_id?: string | null
          tahun_zakat_id?: string
          tanggal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pemasukan_uang_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pemasukan_uang_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pemasukan_uang_muzakki_id_fkey"
            columns: ["muzakki_id"]
            isOneToOne: false
            referencedRelation: "muzakki"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pemasukan_uang_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "transaction_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pemasukan_uang_tahun_zakat_id_fkey"
            columns: ["tahun_zakat_id"]
            isOneToOne: false
            referencedRelation: "tahun_zakat"
            referencedColumns: ["id"]
          },
        ]
      }
      pembayaran_zakat: {
        Row: {
          account_id: string | null
          akun_uang: Database["public"]["Enums"]["akun_uang"] | null
          catatan: string | null
          created_at: string | null
          created_by: string | null
          id: string
          jenis_zakat: string
          jumlah_beras_kg: number | null
          jumlah_jiwa: number
          jumlah_uang_dibayar_rp: number | null
          jumlah_uang_rp: number | null
          muzakki_id: string
          nilai_per_orang: number
          petugas_penerima: string
          tag_id: string | null
          tahun_zakat_id: string
          tanggal_bayar: string | null
          tanggal_pembayaran: string
          total_zakat: number
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          akun_uang?: Database["public"]["Enums"]["akun_uang"] | null
          catatan?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          jenis_zakat: string
          jumlah_beras_kg?: number | null
          jumlah_jiwa?: number
          jumlah_uang_dibayar_rp?: number | null
          jumlah_uang_rp?: number | null
          muzakki_id: string
          nilai_per_orang: number
          petugas_penerima: string
          tag_id?: string | null
          tahun_zakat_id: string
          tanggal_bayar?: string | null
          tanggal_pembayaran?: string
          total_zakat: number
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          akun_uang?: Database["public"]["Enums"]["akun_uang"] | null
          catatan?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          jenis_zakat?: string
          jumlah_beras_kg?: number | null
          jumlah_jiwa?: number
          jumlah_uang_dibayar_rp?: number | null
          jumlah_uang_rp?: number | null
          muzakki_id?: string
          nilai_per_orang?: number
          petugas_penerima?: string
          tag_id?: string | null
          tahun_zakat_id?: string
          tanggal_bayar?: string | null
          tanggal_pembayaran?: string
          total_zakat?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pembayaran_zakat_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pembayaran_zakat_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pembayaran_zakat_muzakki_id_fkey"
            columns: ["muzakki_id"]
            isOneToOne: false
            referencedRelation: "muzakki"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pembayaran_zakat_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "transaction_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pembayaran_zakat_tahun_zakat_id_fkey"
            columns: ["tahun_zakat_id"]
            isOneToOne: false
            referencedRelation: "tahun_zakat"
            referencedColumns: ["id"]
          },
        ]
      }
      qurban_participants: {
        Row: {
          id: string
          nama: string
          qurban_registration_id: string
          urutan: number
        }
        Insert: {
          id?: string
          nama: string
          qurban_registration_id: string
          urutan: number
        }
        Update: {
          id?: string
          nama?: string
          qurban_registration_id?: string
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "qurban_participants_qurban_registration_id_fkey"
            columns: ["qurban_registration_id"]
            isOneToOne: false
            referencedRelation: "qurban_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      qurban_registrations: {
        Row: {
          alamat: string
          biaya_perawatan: number | null
          catatan: string | null
          created_at: string
          created_by: string | null
          id: string
          jenis: string
          nama: string
          no_hp: string
          no_qurban: string
          nominal: number
          photo_url: string | null
          status: string
          sumber_hewan: string
          tanggal: string
          updated_at: string
        }
        Insert: {
          alamat: string
          biaya_perawatan?: number | null
          catatan?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          jenis: string
          nama: string
          no_hp: string
          no_qurban: string
          nominal: number
          photo_url?: string | null
          status?: string
          sumber_hewan: string
          tanggal: string
          updated_at?: string
        }
        Update: {
          alamat?: string
          biaya_perawatan?: number | null
          catatan?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          jenis?: string
          nama?: string
          no_hp?: string
          no_qurban?: string
          nominal?: number
          photo_url?: string | null
          status?: string
          sumber_hewan?: string
          tanggal?: string
          updated_at?: string
        }
        Relationships: []
      }
      rekonsiliasi: {
        Row: {
          account_id: string | null
          akun: Database["public"]["Enums"]["akun_uang"] | null
          catatan: string
          created_at: string
          created_by: string
          id: string
          jenis: Database["public"]["Enums"]["jenis_zakat"]
          jumlah_beras_kg: number | null
          jumlah_uang_rp: number | null
          tahun_zakat_id: string
          tanggal: string
        }
        Insert: {
          account_id?: string | null
          akun?: Database["public"]["Enums"]["akun_uang"] | null
          catatan: string
          created_at?: string
          created_by: string
          id?: string
          jenis: Database["public"]["Enums"]["jenis_zakat"]
          jumlah_beras_kg?: number | null
          jumlah_uang_rp?: number | null
          tahun_zakat_id: string
          tanggal?: string
        }
        Update: {
          account_id?: string | null
          akun?: Database["public"]["Enums"]["akun_uang"] | null
          catatan?: string
          created_at?: string
          created_by?: string
          id?: string
          jenis?: Database["public"]["Enums"]["jenis_zakat"]
          jumlah_beras_kg?: number | null
          jumlah_uang_rp?: number | null
          tahun_zakat_id?: string
          tanggal?: string
        }
        Relationships: [
          {
            foreignKeyName: "rekonsiliasi_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rekonsiliasi_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rekonsiliasi_tahun_zakat_id_fkey"
            columns: ["tahun_zakat_id"]
            isOneToOne: false
            referencedRelation: "tahun_zakat"
            referencedColumns: ["id"]
          },
        ]
      }
      tahun_zakat: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          nilai_beras_kg: number
          nilai_uang_rp: number
          tahun_hijriah: string
          tahun_masehi: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          nilai_beras_kg: number
          nilai_uang_rp: number
          tahun_hijriah: string
          tahun_masehi: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          nilai_beras_kg?: number
          nilai_uang_rp?: number
          tahun_hijriah?: string
          tahun_masehi?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      transaction_tags: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_invitations: {
        Row: {
          created_at: string | null
          created_by: string
          email: string
          expires_at: string
          id: string
          revoked_at: string | null
          role: string
          token_hash: string
          updated_at: string | null
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          email: string
          expires_at: string
          id?: string
          revoked_at?: string | null
          role: string
          token_hash: string
          updated_at?: string | null
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          email?: string
          expires_at?: string
          id?: string
          revoked_at?: string | null
          role?: string
          token_hash?: string
          updated_at?: string | null
          used_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          address: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          nama_lengkap: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          nama_lengkap: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          nama_lengkap?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      account_latest_balances: {
        Row: {
          account_id: string | null
          current_balance: number | null
          last_entry_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_ledger_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_current_user_is_active: { Args: never; Returns: boolean }
      get_current_user_role: { Args: never; Returns: string }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_active_user: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_admin_user: { Args: never; Returns: boolean }
      next_bukti_sedekah_number: {
        Args: { p_category_key: string }
        Returns: string
      }
      peek_bukti_sedekah_number: {
        Args: { p_category_key: string }
        Returns: string
      }
    }
    Enums: {
      account_channel: "kas" | "bank" | "qris"
      account_ledger_entry_type: "IN" | "OUT" | "REKONSILIASI"
      akun_uang: "kas" | "bank"
      hak_amil_basis_mode:
        | "net_after_reconciliation"
        | "gross_before_reconciliation"
      hak_amil_kategori:
        | "zakat_fitrah"
        | "zakat_maal"
        | "infak"
        | "fidyah"
        | "beras"
      jenis_zakat: "beras" | "uang"
      pemasukan_beras_kategori:
        | "infak_sedekah_beras"
        | "maal_beras"
        | "zakat_fitrah_beras"
        | "fidyah_beras"
      pemasukan_uang_kategori:
        | "zakat_fitrah_uang"
        | "fidyah_uang"
        | "maal_penghasilan_uang"
        | "infak_sedekah_uang"
      status_distribusi: "pending" | "selesai"
      user_role: "admin" | "petugas" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_channel: ["kas", "bank", "qris"],
      account_ledger_entry_type: ["IN", "OUT", "REKONSILIASI"],
      akun_uang: ["kas", "bank"],
      hak_amil_basis_mode: [
        "net_after_reconciliation",
        "gross_before_reconciliation",
      ],
      hak_amil_kategori: [
        "zakat_fitrah",
        "zakat_maal",
        "infak",
        "fidyah",
        "beras",
      ],
      jenis_zakat: ["beras", "uang"],
      pemasukan_beras_kategori: [
        "infak_sedekah_beras",
        "maal_beras",
        "zakat_fitrah_beras",
        "fidyah_beras",
      ],
      pemasukan_uang_kategori: [
        "zakat_fitrah_uang",
        "fidyah_uang",
        "maal_penghasilan_uang",
        "infak_sedekah_uang",
      ],
      status_distribusi: ["pending", "selesai"],
      user_role: ["admin", "petugas", "viewer"],
    },
  },
} as const

