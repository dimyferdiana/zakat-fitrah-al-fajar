import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { QurbanDashboardStats, QurbanEventStats } from '@/types/qurban'

export function useQurbanDashboardStats(eventId?: string | null) {
  return useQuery({
    queryKey: ['qurban-dashboard', eventId],
    queryFn: async (): Promise<QurbanDashboardStats> => {
      // 1. Animal counts
      let animalsQ = supabase.from('qurban_animals').select('jenis, event_id')
      if (eventId) animalsQ = animalsQ.eq('event_id', eventId)
      const { data: animals } = await animalsQ
      const totalSapi = (animals || []).filter(a => a.jenis === 'sapi').length
      const totalKambing = (animals || []).filter(a => a.jenis === 'kambing').length

      // 2. Shares (peserta + nominal)
      let sharesQ = supabase
        .from('qurban_shares')
        .select('id, nominal, status_pembayaran, qurban_animals!inner(event_id, jenis)')
      if (eventId) sharesQ = sharesQ.eq('qurban_animals.event_id', eventId)
      const { data: shares } = await sharesQ
      const shareList = (shares || []) as any[]
      const totalPeserta = shareList.length
      const totalNominal = shareList.reduce((s, r) => s + (r.nominal ?? 0), 0)
      const lunasShares = shareList.filter(r => r.status_pembayaran === 'lunas')
      const belumShares = shareList.filter(r => r.status_pembayaran === 'belum_bayar')

      // Per-animal-type share breakdowns
      const sapiShares = shareList.filter(r => r.qurban_animals?.jenis === 'sapi')
      const kambingShares = shareList.filter(r => r.qurban_animals?.jenis === 'kambing')
      const pesertaSapi = sapiShares.length
      const pesertaDomba = kambingShares.length
      const nominalSapi = sapiShares.reduce((s: number, r: any) => s + (r.nominal ?? 0), 0)
      const nominalDomba = kambingShares.reduce((s: number, r: any) => s + (r.nominal ?? 0), 0)
      const sisaSlotSapi = totalSapi * 7 - pesertaSapi
      const sisaSlotDomba = totalKambing * 1 - pesertaDomba

      // 3. Coupons
      let couponsQ = supabase.from('qurban_coupons').select('status, event_id')
      if (eventId) couponsQ = couponsQ.eq('event_id', eventId)
      const { data: coupons } = await couponsQ
      const couponList = (coupons || []) as Array<{ status: string; event_id: string }>

      // 4. Per-event breakdown
      const { data: events } = await supabase
        .from('qurban_events')
        .select('id, nama, tanggal, catatan, created_by, created_at, updated_at')
        .order('tanggal', { ascending: false })

      const perEvent: QurbanEventStats[] = (events || []).map(event => {
        const evAnimals = (animals || []).filter(a => a.event_id === event.id)
        const evShares = shareList.filter((r: any) => r.qurban_animals?.event_id === event.id)
        const evCoupons = couponList.filter(c => c.event_id === event.id)
        return {
          event,
          sapiCount: evAnimals.filter(a => a.jenis === 'sapi').length,
          kambingCount: evAnimals.filter(a => a.jenis === 'kambing').length,
          pesertaCount: evShares.length,
          lunasNominal: evShares.filter((r: any) => r.status_pembayaran === 'lunas').reduce((s: number, r: any) => s + r.nominal, 0),
          belumBayarNominal: evShares.filter((r: any) => r.status_pembayaran === 'belum_bayar').reduce((s: number, r: any) => s + r.nominal, 0),
          couponsIssued: evCoupons.length,
          couponsRedeemed: evCoupons.filter(c => c.status === 'redeemed').length,
        }
      })

      return {
        totalSapi,
        totalKambing,
        totalPeserta,
        totalNominal,
        lunasCount: lunasShares.length,
        lunasNominal: lunasShares.reduce((s: number, r: any) => s + (r.nominal ?? 0), 0),
        belumBayarCount: belumShares.length,
        belumBayarNominal: belumShares.reduce((s: number, r: any) => s + (r.nominal ?? 0), 0),
        couponsIssued: couponList.length,
        couponsRedeemed: couponList.filter(c => c.status === 'redeemed').length,
        perEvent,
        pesertaSapi,
        pesertaDomba,
        nominalSapi,
        nominalDomba,
        sisaSlotSapi,
        sisaSlotDomba,
      }
    },
  })
}
