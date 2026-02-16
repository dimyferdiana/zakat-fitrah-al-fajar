- select * from public.pembayaran_zakat limit 1; Success. No rows returned
- select * from public.distribusi_zakat limit 1; Success. No rows returned
- select jumlah_beras_kg, jumlah_uang_rp, jenis_zakat, tahun_zakat_id from public.pembayaran_zakat limit 1; Error: Failed to run sql query: ERROR: 42703: column "jumlah_beras_kg" does not exist LINE 1: select jumlah_beras_kg, jumlah_uang_rp, jenis_zakat, tahun_zakat_id from public.pembayaran_zakat limit 1; ^

-select jumlah_beras_kg, jumlah_uang_rp, jenis_distribusi, tahun_zakat_id from public.distribusi_zakat limit 1; Error: Failed to run sql query: ERROR: 42703: column "jumlah_beras_kg" does not exist LINE 1: select jumlah_beras_kg, jumlah_uang_rp, jenis_distribusi, tahun_zakat_id from public.distribusi_zakat limit 1; ^

Console:
@supabase_supabase-j…js?v=79a22ab8:11403 
 GET https://zuykdhqdklsskgrtwejg.supabase.co/rest/v1/pembayaran_zakat?select=ju…ahun_zakat_id=eq.1f368755-5c08-4d4e-b60a-474fc5a6ee94&jenis_zakat=eq.beras 400 (Bad Request)
(anonymous)	@	@supabase_supabase-j…js?v=79a22ab8:11403
(anonymous)	@	@supabase_supabase-j…js?v=79a22ab8:11417
await in (anonymous)		
then	@	@supabase_supabase-js.js?v=79a22ab8:269
Request URL
https://zuykdhqdklsskgrtwejg.supabase.co/rest/v1/pembayaran_zakat?select=jumlah_beras_kg&tahun_zakat_id=eq.1f368755-5c08-4d4e-b60a-474fc5a6ee94&jenis_zakat=eq.beras
Request Method
GET
Status Code
400 Bad Request
Remote Address
172.64.149.246:443
Referrer Policy
strict-origin-when-cross-origin
access-control-allow-origin
http://localhost:5173
access-control-expose-headers
Content-Encoding, Content-Location, Content-Range, Content-Type, Date, Location, Server, Transfer-Encoding, Range-Unit
alt-svc
h3=":443"; ma=86400
cf-cache-status
DYNAMIC
cf-ray
9b2c3aa9f8cbced2-CGK
content-encoding
gzip
content-type
application/json; charset=utf-8
date
Wed, 24 Dec 2025 01:12:13 GMT
priority
u=1,i
proxy-status
PostgREST; error=42703
sb-gateway-version
1
sb-project-ref
zuykdhqdklsskgrtwejg
sb-request-id
019b4de9-e645-7c83-9fd9-b5619aa38417
server
cloudflare
server-timing
cfExtPri
set-cookie
__cf_bm=WnHGtBQ1DGqTmDF2LHkUl4YgxLRv0cVxmljFIstbYDA-1766538733-1.0.1.1-tsLwYkDQuvtfsMyFMRmVQ0zCHNwRXsHvKniG2ZQJz8G1sNj_nIDdWvyZGeluWrYfriJBoeBmeslexgAgPWUM9eiuH6qryL5jansTSbU7.20; path=/; expires=Wed, 24-Dec-25 01:42:13 GMT; domain=.supabase.co; HttpOnly; Secure; SameSite=None
strict-transport-security
max-age=31536000; includeSubDomains; preload
vary
Accept-Encoding
x-content-type-options
nosniff
x-envoy-attempt-count
1
x-envoy-upstream-service-time
4
:authority
zuykdhqdklsskgrtwejg.supabase.co
:method
GET
:path
/rest/v1/pembayaran_zakat?select=jumlah_beras_kg&tahun_zakat_id=eq.1f368755-5c08-4d4e-b60a-474fc5a6ee94&jenis_zakat=eq.beras
:scheme
https
accept
*/*
accept-encoding
gzip, deflate, br, zstd
accept-language
en-US,en;q=0.9
accept-profile
public
apikey
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1eWtkaHFka2xzc2tncnR3ZWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDEyMzEsImV4cCI6MjA4MjA3NzIzMX0.W6sUaaSdvEit3CX2UyQEmc5oAil92aWKF1_CK0Wq6os
authorization
Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6IjQ3YTU3MDg3LTJlODItNDFlOC1hZmY5LTY2ZTRkYzVjMjNhNCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3p1eWtkaHFka2xzc2tncnR3ZWpnLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiMzU0NTg5Ny0wMmY2LTQ4YTMtOGQ2NC0zNTk5Y2VjMjk1ODQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY2NTM5NzEyLCJpYXQiOjE3NjY1MzYxMTIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2NjUxNTA5Nn1dLCJzZXNzaW9uX2lkIjoiYjg2NzNmMzMtOGE4ZS00NTNjLWFjZjQtZDhlMDJmYjk3ZGI4IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.gKeFbJkbhpUZpjuatCXGaAthqCdf4kNQwoQu-aQeSCP4kBSKhl-jXUSYVDykSvlEC1JZbrz50CzNDAWeHDQCbQ
origin
http://localhost:5173
priority
u=1, i
referer
http://localhost:5173/
sec-ch-ua
"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"
sec-ch-ua-mobile
?0
sec-ch-ua-platform
"macOS"
sec-fetch-dest
empty
sec-fetch-mode
cors
sec-fetch-site
cross-site
user-agent
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36
x-client-info
supabase-js-web/2.89.0

core.js:9 [WIREFRAMEIT] - Content Core Script loaded
@supabase_supabase-js.js?v=79a22ab8:11403  GET https://zuykdhqdklsskgrtwejg.supabase.co/rest/v1/pembayaran_zakat?select=jumlah_beras_kg&tahun_zakat_id=eq.1f368755-5c08-4d4e-b60a-474fc5a6ee94&jenis_zakat=eq.beras 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11403
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11417
await in (anonymous)
then @ @supabase_supabase-js.js?v=79a22ab8:269
@supabase_supabase-js.js?v=79a22ab8:11403  GET https://zuykdhqdklsskgrtwejg.supabase.co/rest/v1/pembayaran_zakat?select=tanggal_bayar%2Cjenis_zakat%2Cjumlah_beras_kg%2Cjumlah_uang_rp&tahun_zakat_id=eq.1f368755-5c08-4d4e-b60a-474fc5a6ee94&order=tanggal_bayar.asc 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11403
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11417
await in (anonymous)
then @ @supabase_supabase-js.js?v=79a22ab8:269
@supabase_supabase-js.js?v=79a22ab8:11403  GET https://zuykdhqdklsskgrtwejg.supabase.co/rest/v1/pembayaran_zakat?select=jumlah_uang_rp&tahun_zakat_id=eq.1f368755-5c08-4d4e-b60a-474fc5a6ee94&jenis_zakat=eq.uang 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11403
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11417
await in (anonymous)
then @ @supabase_supabase-js.js?v=79a22ab8:269
@supabase_supabase-js.js?v=79a22ab8:11403  GET https://zuykdhqdklsskgrtwejg.supabase.co/rest/v1/distribusi_zakat?select=jumlah_beras_kg&tahun_zakat_id=eq.1f368755-5c08-4d4e-b60a-474fc5a6ee94&jenis_distribusi=eq.beras&status=eq.selesai 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11403
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11417
await in (anonymous)
then @ @supabase_supabase-js.js?v=79a22ab8:269
@supabase_supabase-js.js?v=79a22ab8:11403  GET https://zuykdhqdklsskgrtwejg.supabase.co/rest/v1/distribusi_zakat?select=jumlah_uang_rp&tahun_zakat_id=eq.1f368755-5c08-4d4e-b60a-474fc5a6ee94&jenis_distribusi=eq.uang&status=eq.selesai 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11403
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11417
await in (anonymous)
then @ @supabase_supabase-js.js?v=79a22ab8:269
@supabase_supabase-js.js?v=79a22ab8:11403  GET https://zuykdhqdklsskgrtwejg.supabase.co/rest/v1/pembayaran_zakat?select=tanggal_bayar%2Cjenis_zakat%2Cjumlah_beras_kg%2Cjumlah_uang_rp&tahun_zakat_id=eq.1f368755-5c08-4d4e-b60a-474fc5a6ee94&order=tanggal_bayar.asc 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11403
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11417
await in (anonymous)
then @ @supabase_supabase-js.js?v=79a22ab8:269
@supabase_supabase-js.js?v=79a22ab8:11403  GET https://zuykdhqdklsskgrtwejg.supabase.co/rest/v1/pembayaran_zakat?select=jumlah_beras_kg&tahun_zakat_id=eq.1f368755-5c08-4d4e-b60a-474fc5a6ee94&jenis_zakat=eq.beras 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11403
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11417
await in (anonymous)
then @ @supabase_supabase-js.js?v=79a22ab8:269
@supabase_supabase-js.js?v=79a22ab8:11403  GET https://zuykdhqdklsskgrtwejg.supabase.co/rest/v1/pembayaran_zakat?select=jumlah_uang_rp&tahun_zakat_id=eq.1f368755-5c08-4d4e-b60a-474fc5a6ee94&jenis_zakat=eq.uang 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11403
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11417
await in (anonymous)
then @ @supabase_supabase-js.js?v=79a22ab8:269
@supabase_supabase-js.js?v=79a22ab8:11403  GET https://zuykdhqdklsskgrtwejg.supabase.co/rest/v1/distribusi_zakat?select=jumlah_beras_kg&tahun_zakat_id=eq.1f368755-5c08-4d4e-b60a-474fc5a6ee94&jenis_distribusi=eq.beras&status=eq.selesai 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11403
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11417
await in (anonymous)
then @ @supabase_supabase-js.js?v=79a22ab8:269
@supabase_supabase-js.js?v=79a22ab8:11403  GET https://zuykdhqdklsskgrtwejg.supabase.co/rest/v1/distribusi_zakat?select=jumlah_uang_rp&tahun_zakat_id=eq.1f368755-5c08-4d4e-b60a-474fc5a6ee94&jenis_distribusi=eq.uang&status=eq.selesai 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11403
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11417
await in (anonymous)
then @ @supabase_supabase-js.js?v=79a22ab8:269
@supabase_supabase-js.js?v=79a22ab8:11403  GET https://zuykdhqdklsskgrtwejg.supabase.co/rest/v1/pembayaran_zakat?select=jumlah_beras_kg&tahun_zakat_id=eq.1f368755-5c08-4d4e-b60a-474fc5a6ee94&jenis_zakat=eq.beras 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11403
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11417
await in (anonymous)
then @ @supabase_supabase-js.js?v=79a22ab8:269
@supabase_supabase-js.js?v=79a22ab8:11403  GET https://zuykdhqdklsskgrtwejg.supabase.co/rest/v1/pembayaran_zakat?select=jumlah_uang_rp&tahun_zakat_id=eq.1f368755-5c08-4d4e-b60a-474fc5a6ee94&jenis_zakat=eq.uang 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11403
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11417
await in (anonymous)
then @ @supabase_supabase-js.js?v=79a22ab8:269
@supabase_supabase-js.js?v=79a22ab8:11403  GET https://zuykdhqdklsskgrtwejg.supabase.co/rest/v1/distribusi_zakat?select=jumlah_beras_kg&tahun_zakat_id=eq.1f368755-5c08-4d4e-b60a-474fc5a6ee94&jenis_distribusi=eq.beras&status=eq.selesai 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11403
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11417
await in (anonymous)
then @ @supabase_supabase-js.js?v=79a22ab8:269
@supabase_supabase-js.js?v=79a22ab8:11403  GET https://zuykdhqdklsskgrtwejg.supabase.co/rest/v1/distribusi_zakat?select=jumlah_uang_rp&tahun_zakat_id=eq.1f368755-5c08-4d4e-b60a-474fc5a6ee94&jenis_distribusi=eq.uang&status=eq.selesai 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11403
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11417
await in (anonymous)
then @ @supabase_supabase-js.js?v=79a22ab8:269
@supabase_supabase-js.js?v=79a22ab8:11403  GET https://zuykdhqdklsskgrtwejg.supabase.co/rest/v1/pembayaran_zakat?select=jumlah_beras_kg&tahun_zakat_id=eq.1f368755-5c08-4d4e-b60a-474fc5a6ee94&jenis_zakat=eq.beras 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11403
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11417
await in (anonymous)
then @ @supabase_supabase-js.js?v=79a22ab8:269
@supabase_supabase-js.js?v=79a22ab8:11403  GET https://zuykdhqdklsskgrtwejg.supabase.co/rest/v1/pembayaran_zakat?select=jumlah_uang_rp&tahun_zakat_id=eq.1f368755-5c08-4d4e-b60a-474fc5a6ee94&jenis_zakat=eq.uang 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11403
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11417
await in (anonymous)
then @ @supabase_supabase-js.js?v=79a22ab8:269
@supabase_supabase-js.js?v=79a22ab8:11403  GET https://zuykdhqdklsskgrtwejg.supabase.co/rest/v1/distribusi_zakat?select=jumlah_beras_kg&tahun_zakat_id=eq.1f368755-5c08-4d4e-b60a-474fc5a6ee94&jenis_distribusi=eq.beras&status=eq.selesai 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11403
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11417
await in (anonymous)
then @ @supabase_supabase-js.js?v=79a22ab8:269
@supabase_supabase-js.js?v=79a22ab8:11403  GET https://zuykdhqdklsskgrtwejg.supabase.co/rest/v1/distribusi_zakat?select=jumlah_uang_rp&tahun_zakat_id=eq.1f368755-5c08-4d4e-b60a-474fc5a6ee94&jenis_distribusi=eq.uang&status=eq.selesai 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11403
(anonymous) @ @supabase_supabase-js.js?v=79a22ab8:11417
await in (anonymous)
then @ @supabase_supabase-js.js?v=79a22ab8:269
Request URL
https://zuykdhqdklsskgrtwejg.supabase.co/rest/v1/pembayaran_zakat?select=tanggal_bayar%2Cjenis_zakat%2Cjumlah_beras_kg%2Cjumlah_uang_rp&tahun_zakat_id=eq.1f368755-5c08-4d4e-b60a-474fc5a6ee94&order=tanggal_bayar.asc
Request Method
GET
Status Code
400 Bad Request
Remote Address
172.64.149.246:443
Referrer Policy
strict-origin-when-cross-origin
access-control-allow-origin
http://localhost:5173
access-control-expose-headers
Content-Encoding, Content-Location, Content-Range, Content-Type, Date, Location, Server, Transfer-Encoding, Range-Unit
alt-svc
h3=":443"; ma=86400
cf-cache-status
DYNAMIC
cf-ray
9b2c3aaac9b8ced2-CGK
content-encoding
gzip
content-type
application/json; charset=utf-8
date
Wed, 24 Dec 2025 01:12:13 GMT
priority
u=1,i
proxy-status
PostgREST; error=42703
sb-gateway-version
1
sb-project-ref
zuykdhqdklsskgrtwejg
sb-request-id
019b4de9-e6ca-7276-9cca-dd968a5f8b30
server
cloudflare
server-timing
cfExtPri
set-cookie
__cf_bm=NQ5mTG80cWZEwYrN9h.cPEACBMnmMZiW.ENPYs7tNn0-1766538733-1.0.1.1-mIb9UCcvTdtCIorI_BVzQu12baPwuT0_CPwxZaL.MidVyTmZorS4KKIYiMVt8JwjoaH7nlLMmkAuyANmz33o.3E5kzbWnh_qmqR2MzFiIuE; path=/; expires=Wed, 24-Dec-25 01:42:13 GMT; domain=.supabase.co; HttpOnly; Secure; SameSite=None
strict-transport-security
max-age=31536000; includeSubDomains; preload
vary
Accept-Encoding
x-content-type-options
nosniff
x-envoy-attempt-count
1
x-envoy-upstream-service-time
3
:authority
zuykdhqdklsskgrtwejg.supabase.co
:method
GET
:path
/rest/v1/pembayaran_zakat?select=tanggal_bayar%2Cjenis_zakat%2Cjumlah_beras_kg%2Cjumlah_uang_rp&tahun_zakat_id=eq.1f368755-5c08-4d4e-b60a-474fc5a6ee94&order=tanggal_bayar.asc
:scheme
https
accept
*/*
accept-encoding
gzip, deflate, br, zstd
accept-language
en-US,en;q=0.9
accept-profile
public
apikey
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1eWtkaHFka2xzc2tncnR3ZWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDEyMzEsImV4cCI6MjA4MjA3NzIzMX0.W6sUaaSdvEit3CX2UyQEmc5oAil92aWKF1_CK0Wq6os
authorization
Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6IjQ3YTU3MDg3LTJlODItNDFlOC1hZmY5LTY2ZTRkYzVjMjNhNCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3p1eWtkaHFka2xzc2tncnR3ZWpnLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiMzU0NTg5Ny0wMmY2LTQ4YTMtOGQ2NC0zNTk5Y2VjMjk1ODQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY2NTM5NzEyLCJpYXQiOjE3NjY1MzYxMTIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2NjUxNTA5Nn1dLCJzZXNzaW9uX2lkIjoiYjg2NzNmMzMtOGE4ZS00NTNjLWFjZjQtZDhlMDJmYjk3ZGI4IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.gKeFbJkbhpUZpjuatCXGaAthqCdf4kNQwoQu-aQeSCP4kBSKhl-jXUSYVDykSvlEC1JZbrz50CzNDAWeHDQCbQ
origin
http://localhost:5173
priority
u=1, i
referer
http://localhost:5173/
sec-ch-ua
"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"
sec-ch-ua-mobile
?0
sec-ch-ua-platform
"macOS"
sec-fetch-dest
empty
sec-fetch-mode
cors
sec-fetch-site
cross-site
user-agent
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36
x-client-info
supabase-js-web/2.89.0

