import { Beef, Users, Wallet } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      <StatCard
        title="Total Nominal"
        value={formatCurrency(stats.totalNominal)}
        description="nominal terkumpul"
        icon={Wallet}
      />
    </div>
  )
}
