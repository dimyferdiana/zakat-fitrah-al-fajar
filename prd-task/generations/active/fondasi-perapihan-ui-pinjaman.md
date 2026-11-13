# Fondasi perapihan navigasi dan UI pinjaman

Tanggal: 11 November 2026. Branch: `feature/perapihan-ui-pinjaman`, dasar `7c6e491`. Ini adalah inventaris dan rancangan sebelum refactor; daftar pengujian untuk pekerjaan baru adalah rencana, bukan hasil implementasi.

## 1. Inventaris dan pemisahan

`App.tsx` menjaga `/pinjaman` untuk admin/petugas, `/pinjaman/ringkasan` untuk admin/petugas/viewer, dan `/portal-pinjaman` untuk mode nasabah. `AppLayout` memiliki satu menu Nasabah & Pinjaman; `AppSwitcher` membuka `/pinjaman`, atau `/pinjaman/ringkasan` untuk viewer. `LoanManagement` memuat semua bagian dalam satu halaman dengan anchor `loan-dashboard`, `loan-claims`, `loan-settings`, `loan-customers`, `loan-drafts` dan `rincian-pinjaman`; pilihan rincian berada dalam state, bukan URL.

| Tujuan baru | Sumber dan pekerjaan existing yang dipertahankan | Data dan mutasi utama |
|---|---|---|
| Ringkasan | `LoanDashboard`: saldo, pekerjaan tertunda dan tautan ke pinjaman; pecah laporan dan profil | `loan_dashboard_report_data`, `loan_collectibility_config`; proyeksi ringkas baru harus dibatasi konteks |
| Nasabah dan profil | `LoanManagement`, `WargaForm`, `LoanAccountRecovery`, `LoanStaffAccountLink`: pencarian individu, pendaftaran, akses dan penautan | `muzakki`, `loan_customers`, `loan_confirm_individual`, `loan_register_customer`, `loan-customer-account`, `loan_link_staff_customer`, `loan_customer_obligations` |
| Pinjaman, buat dan rincian | `LoanManagement`, `LoanCustomerSelect`, `LoanDraftControls`, `LoanScheduleEditor`, `LoanContractTemplate`, `LoanDisbursementEvidence`, `LoanFollowups`, `LoanPaymentForm` | `loans`, angsuran, pembayaran, dokumen; `loan_create_complete_draft`, `loan_set_draft_details`, `loan_update_draft_schedule`, `loan_record_policy_exception`, `loan_cancel_draft`, `loan_disburse`, `loan_add_followup`, kontrak/unggahan dan pembayaran |
| Pembayaran | `LoanClaimQueue`, `LoanPaymentForm`, riwayat dan tanda terima di rincian | `loan_claim_review_queue`, `loan_review_payment_claim`, `loan_record_staff_payment`, `loan_cancel_payment`, `loan-staff-payment-evidence`; bukti privat terkait ID pembayaran |
| Laporan | bagian distribusi, tren, profil, tunggakan dan ekspor `LoanDashboard`; `loanReport.ts` | `loan_dashboard_report_data`, snapshot wilayah, transaksi dan posisi; ekspor seluruh hasil filter |
| Pengaturan | `LoanPolicyControls`, `LoanCollectibilityControls`, `LoanContractTemplate`, izin viewer dari `LoanViewerSummary` | `loan_set_category`, `loan_set_policy`, `loan_set_collectibility`, `loan_create_contract_template`, `loan_list_viewers`, `loan_set_viewer_access` |

Query halaman saat ini mencakup pencarian `muzakki`, nasabah, kategori, `loan_staff_choices`, `loan_customer_obligations`, 50 `loans` terbaru, rincian terkait ID dan fallback pinjaman terpilih. State lokal meliputi nasabah, isian dan pratinjau jadwal, pilihan pinjaman, akun, alasan koreksi, kontrak dan pencairan; ref request ID menjaga retry, ref berkas dan password tidak boleh dipindahkan ke URL/storage umum. Mutasi menginvalidasi query terkait daftar, rincian, kewajiban, dashboard dan kolektabilitas; pemisahan harus memperluas invalidasi ke halaman baru tanpa kehilangan konteks. `loanSchedule.ts`, `loanCalculations.ts`, `loanReport.ts`, `loanDocuments.ts`, `loanReceipt.ts` dan Edge Functions adalah dependensi bisnis/dokumen, bukan aturan baru.

## 2. Matriks akses yang harus dipertahankan

| Permukaan | Admin aktif | Petugas aktif | Viewer berizin / tanpa izin | Nasabah aktif | Nonaktif / anonim |
|---|---|---|---|---|---|
| Halaman kerja pengurus dan RPC transaksi | Ya | Ya sesuai fungsi | Tidak / tidak | Tidak | Tidak |
| Pengaturan kebijakan, template, akun dan pemberian izin viewer | Ya | Hanya baca yang diizinkan; mutasi admin ditolak | Tidak / tidak | Tidak | Tidak |
| `/pinjaman/ringkasan`, `loan_viewer_summary` | Ya | Ya | Proyeksi terbatas / ditolak oleh RPC | Tidak | Tidak |
| Portal, proyeksi dan klaim nasabah | Hanya bila terhubung dan mode nasabah valid | Sama | Tidak hanya karena viewer | Data sendiri, selama akses tidak dijeda | Tidak |
| Storage `pinjaman-jamaah-private` | Dokumen berizin | Dokumen berizin | Tidak / tidak | Hanya dokumen sendiri yang dibolehkan, termasuk kontrak yang dibagikan | Tidak |

`ProtectedRoute` memeriksa status aktif dan role; pembatasan sebenarnya tetap ditegakkan RPC/RLS/Storage dan mode sesi (`081_loan_viewer_access.sql`, `087_private_customer_endpoints.sql`, `109_contract_sharing.sql`). Viewer tanpa izin dapat mencapai route yang mengizinkan role viewer tetapi RPC menolak data. Jangan menganggap route guard sebagai perlindungan API. Cocokkan ulang saat implementasi dengan `loan-viewer-access-local.sql`, `task3-security-local.mjs`, `task6-role-guard-local.mjs`, `task8-dashboard-api-local.mjs` dan pengujian bypass lintas identitas. Akses kontrak nasabah bergantung pada sharing; bukti dan tipe dokumen lain tetap mengikuti kebijakan masing-masing.

## 3. Definisi angka dan interaksi

- `loanPosition` mengalokasikan pembayaran **confirmed** sampai tanggal posisi ke angsuran berurutan; sisa adalah jumlah sisa angsuran, tunggakan adalah sisa angsuran dengan tanggal sebelum tanggal posisi. Snapshot migrasi dipakai jika valid; pembayaran setelah cutoff saja diterapkan terhadapnya.
- `reportRows` mensyaratkan jadwal, jumlah pokok dan snapshot migrasi valid. Posisi yang tidak bisa dihitung adalah `null`/tidak lengkap, bukan nol individual. Agregat hanya menjumlah posisi terverifikasi dan harus menyebut jumlah yang tidak lengkap. Pinjaman aktif terverifikasi memiliki sisa positif; klaim menunggu adalah jumlah klaim pending saat ini, bukan saldo dan bukan angka historis.
- Jatuh tempo tujuh hari mengikuti implementasi saat ini: tanggal posisi sampai posisi + 7 hari inklusif. Tunggakan dan jatuh tempo dapat tumpang tindih dengan kategori pekerjaan lain; jangan jumlahkan menjadi pinjaman unik. Periode transaksi dan tanggal posisi harus ditampilkan terpisah.
- Dari pekerjaan tertunda satu klik membuka rincian dengan ID yang benar; Lihat semua membuka daftar terfilter. Kembali mempertahankan filter/halaman. Setiap area memiliki satu aksi utama; transaksi berisiko tetap memerlukan konfirmasi kontekstual.

## 4. Rencana verifikasi FR dan AC

Setiap rentang di bawah mencakup setiap ID dalam rentang. Bukti akan diisi pada task terkait dan task 9; baseline existing tidak membuktikan implementasi baru.

| FR | Implementasi yang direncanakan | Bukti yang harus dikumpulkan |
|---|---|---|
| 001–006 | task 2: enam route, sidebar, redirect/hash, rincian URL dan guard | browser desktop/ponsel, hash, refresh, Back/Forward dan bypass role; AC 01–03 |
| 007–009 | task 7: ringkasan, hitungan dan pekerjaan tertunda | fixture kosong/lengkap/tidak lengkap, cocokkan rincian dan satu klik; AC 04 |
| 010–013 | task 3–4: data nasabah, pendaftaran, profil dan akun | nama sama, rumah tangga, admin/petugas, keamanan password; AC 07–08 |
| 014–016 | task 3 dan 5: query seluruh data, daftar dan state URL | >50 data, filter, paginasi dan kembali; AC 05–06 |
| 017–021 | task 5: tiga tahap, jadwal dan perlindungan input | tiga pola, validasi, retry dan navigasi tak tersimpan; AC 09–10 |
| 022–026 | task 5: rincian, kontrak dan pencairan | draft tidak sah/sah, snapshot, unggah dan pemuatan ulang; AC 11–12, 15 |
| 027–030 | task 6: antrean, riwayat dan transaksi | bukti, alasan, idempotensi, konflik dan cache; AC 13, 15 |
| 031–034 | task 7: laporan, ekspor, konfigurasi dan metadata | filter, semua halaman, CSV/PDF, hak admin/petugas, kas; AC 14–16, 18 |
| 035–039 | task 8: Shadcn UI, format, responsivitas, aksesibilitas dan keadaan | audit komponen, viewport, keyboard/sentuhan, validasi; AC 17 |
| 040 | task 3: query sesuai halaman dan invalidasi | periksa request/query dan uji privasi serta cache; AC 03–04, 13, 18 |

| AC | Skenario dan bukti yang direncanakan |
|---|---|
| 01–02 | Browser: enam tujuan, active state, redirect anchor, refresh dan riwayat. |
| 03 | Browser dan API: viewer berizin/tidak, nasabah, nonaktif dan bypass route. |
| 04 | Fixture kosong/terisi/tidak lengkap; angka dibandingkan sumber dan tanpa formulir admin. |
| 05–06 | Fixture >50 pinjaman; cari, filter, buka detail, kembali, validasi URL. |
| 07–08 | Identitas dan akun: individu, rumah tangga, nama sama, role, password. |
| 09–10 | Jadwal mingguan/bulanan/khusus, retry, input hilang dan kesalahan. |
| 11–12 | Kontrak dan kewajiban memblokir pencairan; pencairan sah dan dokumen. |
| 13 | Bayar/verifikasi/tolak/batal, transaksi bersamaan dan data terbaru. |
| 14 | Bandingkan CSV/PDF dengan seluruh hasil filter dan uji formula. |
| 15 | Dokumen privat, snapshot, audit dan koreksi historis lintas identitas. |
| 16 | Pengaturan admin/petugas dan kondisi kolektabilitas nonaktif. |
| 17 | Dua viewport, keyboard/sentuhan, seluruh keadaan dan audit Shadcn UI. |
| 18 | Fingerprint kas/penerimaan sebelum-sesudah; regresi saldo, RLS, akun, konkurensi dan Storage. |

## 5. Baseline dan lingkungan

Hasil pengujian dan status lingkungan dicatat di [baseline task 1](baseline-perapihan-ui-pinjaman.md); rancangan dua viewport tersedia di [wireframe](wireframe-perapihan-ui-pinjaman.md).
