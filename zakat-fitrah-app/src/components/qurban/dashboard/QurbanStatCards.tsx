import { Beef, Users, Wallet } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { QurbanDashboardStats } from '@/types/qurban'

interface QurbanStatCardsProps {
  stats: QurbanDashboardStats
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)

// Simple sheep-like icon using lucide's available icons
function GoatIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Simplified animal head/body shape for kambing */}
      <circle cx="9" cy="8" r="3" />
      <path d="M6 11 4 18" />
      <path d="M12 11 14 18" />
      <path d="M7 8 5 5" />
      <path d="M11 8 13 5" />
      <path d="M6 18 8 18" />
      <path d="M12 18 14 18" />
    </svg>
  )
}

export function QurbanStatCards({ stats }: QurbanStatCardsProps) {
  return (
    <div className="space-y-4">
      {/* Top row: animals + participants */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Sapi"
          value={stats.totalSapi}
          description="ekor sapi"
          icon={Beef}
        />
        <StatCard
          title="Total Kambing"
          value={stats.totalKambing}
          description="ekor kambing"
          icon={GoatIcon as any}
        />
        <StatCard
          title="Total Peserta"
          value={stats.totalPeserta}
          description="peserta terdaftar"
          icon={Users}
        />
      </div>

      {/* Bottom row: Sapi card (left) + Domba card (right) */}
      <div className="grid grid-cols-2 gap-4">
        {/* Sapi card — LEFT */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rekap Sapi</CardTitle>
            <Beef className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold">{formatCurrency(stats.nominalSapi)}</div>
            <p className="text-xs text-muted-foreground">nominal sapi terkumpul</p>
            <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Total Sapi</span>
                <span className="font-medium text-foreground">{stats.totalSapi} ekor</span>
              </div>
              <div className="flex justify-between">
                <span>Peserta</span>
                <span className="font-medium text-foreground">{stats.pesertaSapi} orang</span>
              </div>
              <div className="flex justify-between">
                <span>Sisa Slot</span>
                <span className="font-medium text-foreground">{stats.sisaSlotSapi}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Domba card — RIGHT */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rekap Domba</CardTitle>
            <GoatIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold">{formatCurrency(stats.nominalDomba)}</div>
            <p className="text-xs text-muted-foreground">nominal domba terkumpul</p>
            <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Total Domba</span>
                <span className="font-medium text-foreground">{stats.totalKambing} ekor</span>
              </div>
              <div className="flex justify-between">
                <span>Peserta</span>
                <span className="font-medium text-foreground">{stats.pesertaDomba} orang</span>
              </div>
              <div className="flex justify-between">
                <span>Sisa Slot</span>
                <span className="font-medium text-foreground">{stats.sisaSlotDomba}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Combined nominal summary */}
      <div className="grid grid-cols-1">
        <StatCard
          title="Total Nominal"
          value={formatCurrency(stats.totalNominal)}
          description="total nominal terkumpul (sapi + domba)"
          icon={Wallet}
        />
      </div>
    </div>
  )
}
