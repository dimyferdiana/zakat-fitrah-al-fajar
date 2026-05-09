import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useMuzakkiHistory } from '@/hooks/useMuzakki'
import type { MuzakkiMaster } from '@/hooks/useMuzakki'

interface WargaHistorySheetProps {
  warga: MuzakkiMaster | null
  onClose: () => void
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export function WargaHistorySheet({ warga, onClose }: WargaHistorySheetProps) {
  const { data: history, isLoading } = useMuzakkiHistory(warga?.id ?? null)

  return (
    <Sheet open={!!warga} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Riwayat — {warga?.nama_kk}</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : (
          <div className="space-y-6 mt-6">
            {/* Zakat History */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Riwayat Zakat Fitrah</h3>
              {!history?.zakat.length ? (
                <p className="text-sm text-muted-foreground">Belum ada riwayat zakat.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Jiwa</TableHead>
                      <TableHead>Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.zakat.map((z) => (
                      <TableRow key={z.id}>
                        <TableCell className="text-xs">
                          {format(new Date(z.tanggal_bayar), 'dd MMM yyyy', { locale: idLocale })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={z.jenis_zakat === 'beras' ? 'secondary' : 'default'}>
                            {z.jenis_zakat === 'beras' ? 'Beras' : 'Uang'}
                          </Badge>
                        </TableCell>
                        <TableCell>{z.jumlah_jiwa}</TableCell>
                        <TableCell className="text-xs">
                          {z.jenis_zakat === 'beras'
                            ? `${z.jumlah_beras_kg} kg`
                            : formatCurrency(z.jumlah_uang_rp ?? 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Qurban History */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Riwayat Qurban</h3>
              {!history?.qurban.length ? (
                <p className="text-sm text-muted-foreground">Belum ada riwayat qurban.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Hewan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Nominal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.qurban.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell className="text-xs">{q.event_nama}</TableCell>
                        <TableCell className="text-xs">
                          {q.animal_nomor} ({q.animal_jenis === 'sapi' ? 'Sapi' : 'Kambing'})
                        </TableCell>
                        <TableCell>
                          <Badge variant={q.status_pembayaran === 'lunas' ? 'default' : 'secondary'}>
                            {q.status_pembayaran === 'lunas' ? 'Lunas' : 'Belum Bayar'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{formatCurrency(q.nominal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
