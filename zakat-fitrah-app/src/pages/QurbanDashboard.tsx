import { useState } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useQurbanDashboardStats } from '@/hooks/useQurbanDashboard'
import { useQurbanEventList } from '@/hooks/useQurbanEvents'
import { QurbanStatCards } from '@/components/qurban/dashboard/QurbanStatCards'
import { QurbanPaymentChart } from '@/components/qurban/dashboard/QurbanPaymentChart'
import { QurbanEventCard } from '@/components/qurban/dashboard/QurbanEventCard'

export function QurbanDashboard() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const { data: events = [] } = useQurbanEventList()
  const { data: stats, isLoading } = useQurbanDashboardStats(selectedEventId)

  const displayedPerEvent = selectedEventId
    ? (stats?.perEvent ?? []).filter((e) => e.event.id === selectedEventId)
    : (stats?.perEvent ?? [])

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Dashboard Qurban" description="Rekap statistik hewan qurban, peserta, dan distribusi" />

      {/* Event filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Filter Event:</span>
        <Select
          value={selectedEventId ?? 'all'}
          onValueChange={(val) => setSelectedEventId(val === 'all' ? null : val)}
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Semua Event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Event</SelectItem>
            {events.map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading state */}
      {isLoading && <LoadingSpinner text="Memuat data dashboard..." />}

      {/* Dashboard content */}
      {!isLoading && stats && (
        <div className="space-y-6">
          {/* Stat cards */}
          <QurbanStatCards stats={stats} />

          {/* Payment chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QurbanPaymentChart stats={stats} />
          </div>

          {/* Per-event breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Rekap Per Event</h3>
            {displayedPerEvent.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Belum ada event qurban
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayedPerEvent.map((eventStats) => (
                  <QurbanEventCard key={eventStats.event.id} stats={eventStats} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default QurbanDashboard
