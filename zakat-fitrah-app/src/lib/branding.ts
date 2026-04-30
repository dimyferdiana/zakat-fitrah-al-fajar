/**
 * App Branding Constants
 * Centralized branding strings to avoid hardcoding across the app
 */

export const BRANDING = {
  // Organization names
  ORGANIZATION_FULL: 'YAYASAN AL-FAJAR PERMATA PAMULANG',
  ORGANIZATION_SHORT: 'UPZ Al-Fajar',
  MOSQUE_NAME: 'Masjid Al-Fajar',
  
  // App title
  APP_TITLE: 'Aplikasi UPZ Al-Fajar',
  APP_SUBTITLE: 'Aplikasi Manajemen Zakat Fitrah',
  
  // Report headers
  REPORT_INCOME_HEADER: 'LAPORAN PEMASUKAN ZAKAT FITRAH',
  REPORT_DISTRIBUTION_HEADER: 'LAPORAN DISTRIBUSI ZAKAT FITRAH',
  REPORT_MUSTAHIK_HEADER: 'LAPORAN DAFTAR MUSTAHIK',
  REPORT_HAK_AMIL_HEADER: 'LAPORAN HAK AMIL',
  
  // Receipt titles
  RECEIPT_PAYMENT_TITLE: 'BUKTI PEMBAYARAN ZAKAT FITRAH',
  RECEIPT_DISTRIBUTION_TITLE: 'BUKTI PENERIMAAN ZAKAT FITRAH',
  
  // Address
  ADDRESS: 'Jl. Bukit Permata VII Blok E20/16 Bakti Jaya Setu Tangerang Selatan',
  
  // Logo path
  LOGO_PATH: '/logo-al-fajar.png',
  
  // Sidebar
  SIDEBAR_APP_NAME: 'UPZ Al-Fajar',
  SIDEBAR_MENU_DESCRIPTION: 'Menu navigasi aplikasi UPZ Al-Fajar',
} as const;

/**
 * Get branding value, with fallback to organization name
 */
export function getBrandingValue(key: keyof typeof BRANDING): string {
  return BRANDING[key];
}
