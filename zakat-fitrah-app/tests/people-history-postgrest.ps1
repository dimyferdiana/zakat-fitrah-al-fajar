# Local-only schema/relationship smoke test. Never prints keys or data rows.
$ErrorActionPreference = 'Continue'
$taskLocalStatus = (npx.cmd --no-install supabase status -o json 2>$null | Out-String | ConvertFrom-Json)
$ErrorActionPreference = 'Stop'
if ($LASTEXITCODE -ne 0 -or $taskLocalStatus.API_URL -notmatch '^http://(127\.0\.0\.1|localhost):54321/?$' -or -not $taskLocalStatus.SERVICE_ROLE_KEY) {
  throw 'Supabase lokal tidak tersedia atau URL lokal tidak valid.'
}
$taskHeaders = @{ apikey = $taskLocalStatus.SERVICE_ROLE_KEY; Authorization = "Bearer $($taskLocalStatus.SERVICE_ROLE_KEY)" }
$taskQueries = @(
  @{ Table = 'pembayaran_zakat'; Select = 'id,tanggal_bayar,jenis_zakat,jumlah_jiwa,jumlah_beras_kg,jumlah_uang_rp' },
  @{ Table = 'qurban_shares'; Select = 'id,status_pembayaran,nominal,qurban_animals(nomor,jenis,qurban_events(nama))' },
  @{ Table = 'bukti_sedekah'; Select = 'id,receipt_number,category,amount,tanggal' },
  @{ Table = 'mustahik'; Select = 'id,distribusi_zakat(id,tanggal_distribusi,jenis_distribusi,jumlah_beras_kg,jumlah_uang_rp)' },
  @{ Table = 'loan_customers'; Select = 'id,loans(id,loan_number,status,principal,disbursement_date)' },
  @{ Table = 'pemasukan_uang'; Select = 'id,tanggal,kategori,jumlah_uang_rp' },
  @{ Table = 'pemasukan_beras'; Select = 'id,tanggal,kategori,jumlah_beras_kg' }
)
foreach ($taskQuery in $taskQueries) {
  $taskSelect = [uri]::EscapeDataString($taskQuery.Select)
  $taskUri = "$($taskLocalStatus.API_URL)/rest/v1/$($taskQuery.Table)?select=$taskSelect&limit=0"
  try { $null = Invoke-RestMethod -Uri $taskUri -Headers $taskHeaders -Method Get -TimeoutSec 15 }
  catch { throw "PostgREST lokal gagal memvalidasi skema $($taskQuery.Table)." }
  Write-Output "PASS: $($taskQuery.Table)"
}
