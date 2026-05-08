import QRCode from 'react-qr-code'
import type { QurbanCoupon } from '@/types/qurban'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface CouponShareImageProps {
  coupon: QurbanCoupon
  recipientName: string
  eventName: string
  animalInfo?: string    // e.g. "Sapi #001 · Slot ke-3"
  nominal?: number
  distribusiDate?: string
  mosqueName?: string    // defaults to "Masjid Al-Fajar"
}

// This component is positioned off-screen via the parent's wrapper div.
// It renders a fixed-size coupon card (400x560px) for html2canvas capture.
export function CouponShareImage({
  coupon, recipientName, eventName, animalInfo, nominal, distribusiDate,
  mosqueName = 'Masjid Al-Fajar'
}: CouponShareImageProps) {
  const expiryFormatted = format(new Date(coupon.expires_at), 'dd MMMM yyyy', { locale: id })
  const isMuzakki = coupon.recipient_type === 'muzakki'

  return (
    <div style={{
      width: '400px', height: '560px', backgroundColor: '#ffffff',
      fontFamily: 'Arial, sans-serif', border: '2px solid #e5e7eb',
      borderRadius: '12px', overflow: 'hidden', display: 'flex',
      flexDirection: 'column', alignItems: 'center',
    }}>
      {/* Header */}
      <div style={{
        width: '100%', backgroundColor: '#15803d', color: '#ffffff',
        padding: '16px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{mosqueName}</div>
        <div style={{ fontSize: '13px', marginTop: '4px', opacity: 0.9 }}>
          {isMuzakki ? 'Bukti Pendaftaran Qurban' : 'Kupon Distribusi Daging Qurban'}
        </div>
      </div>

      {/* QR Code */}
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
        <QRCode value={coupon.token} size={160} />
      </div>

      {/* Info rows */}
      <div style={{ width: '100%', padding: '0 20px', flex: 1 }}>
        <InfoRow label="Nama" value={recipientName} />
        <InfoRow label="Event" value={eventName} />
        {animalInfo && <InfoRow label="Hewan" value={animalInfo} />}
        {nominal && <InfoRow label="Nominal" value={`Rp ${nominal.toLocaleString('id-ID')}`} />}
        {distribusiDate && <InfoRow label="Tgl. Distribusi" value={format(new Date(distribusiDate), 'dd MMMM yyyy', { locale: id })} />}
        <InfoRow label="Berlaku Hingga" value={expiryFormatted} />
      </div>

      {/* Coupon number footer */}
      <div style={{
        width: '100%', borderTop: '1px dashed #d1d5db',
        padding: '12px 20px', textAlign: 'center',
        backgroundColor: '#f9fafb',
      }}>
        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>No. Kupon</div>
        <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px', color: '#111827' }}>
          {coupon.coupon_number}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f3f4f6', fontSize: '13px' }}>
      <span style={{ color: '#6b7280', minWidth: '100px' }}>{label}</span>
      <span style={{ color: '#111827', fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

export default CouponShareImage
