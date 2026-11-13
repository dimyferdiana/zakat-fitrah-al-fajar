const dateFormatter = new Intl.DateTimeFormat('id-ID', { day:'numeric', month:'short', year:'numeric', timeZone:'UTC' });
const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', timeZone:'Asia/Jakarta' });

/** Format a calendar date without converting the business date to another time zone. */
export function loanDate(value: string | null | undefined, fallback = 'Belum tersedia'): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) || date.toISOString().slice(0,10) !== value ? fallback : dateFormatter.format(date);
}
export function loanDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? 'Belum tersedia' : `${dateTimeFormatter.format(date)} WIB`;
}
export function loanStatus(value: string): string {
  return ({draft:'Draf', active:'Aktif', paid:'Lunas', cancelled:'Dibatalkan', needs_reconciliation:'Perlu Rekonsiliasi', perlu_rekonsiliasi:'Perlu Rekonsiliasi', belum_dicairkan:'Belum dicairkan', pending:'Menunggu Verifikasi', confirmed:'Terkonfirmasi', rejected:'Ditolak'} as Record<string,string>)[value] ?? 'Tidak tersedia';
}
