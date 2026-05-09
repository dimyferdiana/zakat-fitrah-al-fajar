import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { QurbanEventStats } from '@/types/qurban'

interface QurbanEventCardProps {
  stats: QurbanEventStats
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)

export function QurbanEventCard({ stats }: QurbanEventCardProps) {
  const { event } = stats

  const totalNominal = stats.lunasNominal + stats.belumBayarNominal
  const paymentPercent =
    totalNominal > 0 ? Math.round((stats.lunasNominal / totalNominal) * 100) : 0

  const couponPercent =
    stats.couponsIssued > 0
      ? Math.round((stats.couponsRedeemed / stats.couponsIssued) * 100)
      : 0

  const formattedDate = (() => {
    try {
      return format(new Date(event.tanggal), 'd MMMM yyyy', { locale: id })
    } catch {
      return event.tanggal
    }
  })()

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{event.nama}</CardTitle>
        <CardDescription>{formattedDate}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Sapi</span>
            <p className="font-medium">{stats.sapiCount} ekor</p>
          </div>
          <div>
            <span className="text-muted-foreground">Kambing</span>
            <p className="font-medium">{stats.kambingCount} ekor</p>
          </div>
          <div>
            <span className="text-muted-foreground">Peserta</span>
            <p className="font-medium">{stats.pesertaCount} orang</p>
          </div>
          <div>
            <span className="text-muted-foreground">Nominal Lunas</span>
            <p className="font-medium text-green-600">{formatCurrency(stats.lunasNominal)}</p>
          </div>
        </div>

        {/* Payment progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Pembayaran: {paymentPercent}% lunas</span>
            <span>{paymentPercent}%</span>
          </div>
          <Progress value={paymentPercent} className="h-2" />
        </div>

        {/* Coupon redemption progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              Distribusi: {stats.couponsRedeemed} dari {stats.couponsIssued} kupon ditebus
            </span>
            <span>{couponPercent}%</span>
          </div>
          <Progress value={couponPercent} className="h-2" />
        </div>
      </CardContent>
    </Card>
  )
}
