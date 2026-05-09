import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import QRCode from 'react-qr-code'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Share2 } from 'lucide-react'
import type { QurbanCoupon } from '@/types/qurban'
import { CouponShareImage } from '@/components/qurban/CouponShareImage'
import { shareCouponImage } from '@/lib/couponExport'

interface CouponDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  coupon: QurbanCoupon | null
  recipientName: string
  eventName: string
  // For muzakki coupons:
  animalInfo?: string
  nominal?: number
  // For mustahik coupons:
  distribusiDate?: string
}

function StatusBadge({ status, expiresAt }: { status: QurbanCoupon['status']; expiresAt: string }) {
  const isExpired = status === 'active' && new Date(expiresAt) < new Date()

  if (isExpired) {
    return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Kedaluwarsa</Badge>
  }

  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aktif</Badge>
    case 'redeemed':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Sudah Ditebus</Badge>
    case 'cancelled':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Dibatalkan</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-muted-foreground min-w-[160px]">{label}</span>
      <span className="text-sm font-medium text-right flex-1">{children}</span>
    </div>
  )
}

export function CouponDetailDialog({
  open,
  onOpenChange,
  coupon,
  recipientName,
  eventName,
  animalInfo,
  nominal,
  distribusiDate,
}: CouponDetailDialogProps) {
  const shareImageRef = useRef<HTMLDivElement>(null)
  const [isSharing, setIsSharing] = useState(false)

  if (!coupon) return null

  const isExpired = coupon.status === 'active' && new Date(coupon.expires_at) < new Date()

  const formatDate = (dateStr: string) =>
    format(new Date(dateStr), 'dd MMMM yyyy, HH:mm', { locale: id })

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)

  const handleShare = async () => {
    if (!shareImageRef.current || !coupon) return
    setIsSharing(true)
    try {
      await shareCouponImage(
        shareImageRef.current.firstElementChild as HTMLElement,
        `kupon-${coupon.coupon_number}.png`
      )
    } catch (err) {
      toast.error('Gagal membagikan kupon')
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detail Kupon</DialogTitle>
        </DialogHeader>

        <div className="space-y-1">
          {/* Status */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Status:</span>
            <StatusBadge status={coupon.status} expiresAt={coupon.expires_at} />
          </div>

          {/* Info rows */}
          <InfoRow label="No. Kupon">
            <span className="font-mono">{coupon.coupon_number}</span>
          </InfoRow>

          <InfoRow label="Nama Penerima">{recipientName}</InfoRow>

          <InfoRow label="Event">{eventName}</InfoRow>

          {/* Muzakki-specific */}
          {animalInfo && (
            <InfoRow label="Hewan & Slot">{animalInfo}</InfoRow>
          )}
          {nominal !== undefined && (
            <InfoRow label="Nominal">{formatCurrency(nominal)}</InfoRow>
          )}

          {/* Mustahik-specific */}
          {distribusiDate && (
            <InfoRow label="Tanggal Distribusi">
              {format(new Date(distribusiDate), 'dd MMMM yyyy', { locale: id })}
            </InfoRow>
          )}

          {/* Expiry */}
          <InfoRow label="Berlaku Hingga">
            <span className={isExpired ? 'text-red-600' : ''}>
              {formatDate(coupon.expires_at)}
            </span>
          </InfoRow>

          {/* Redemption time */}
          {coupon.redeemed_at && (
            <InfoRow label="Waktu Redemption">{formatDate(coupon.redeemed_at)}</InfoRow>
          )}
        </div>

        {/* QR Code */}
        <div className="flex justify-center py-4">
          <div className="p-3 bg-white border rounded-lg shadow-sm">
            <QRCode value={coupon.token} size={200} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleShare} disabled={isSharing}>
            <Share2 className="h-4 w-4 mr-2" />
            {isSharing ? 'Memproses...' : 'Bagikan Kupon'}
          </Button>
          <Button onClick={() => onOpenChange(false)}>Tutup</Button>
        </DialogFooter>
      </DialogContent>

      {/* Off-screen coupon image for html2canvas capture */}
      <div
        ref={shareImageRef}
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', zIndex: -1 }}
        aria-hidden="true"
      >
        <CouponShareImage
          coupon={coupon}
          recipientName={recipientName}
          eventName={eventName}
          animalInfo={animalInfo}
          nominal={nominal}
          distribusiDate={distribusiDate}
        />
      </div>
    </Dialog>
  )
}

export default CouponDetailDialog
