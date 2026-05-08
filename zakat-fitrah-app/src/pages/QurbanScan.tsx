// Manual test: scan flow + manual fallback + coupon share tested on 2026-05-08

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Html5Qrcode } from 'html5-qrcode'
import { toast } from 'sonner'
import { ArrowLeft, Camera, CameraOff, Search, CheckCircle2, XCircle, AlertTriangle, Clock, ScanLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useQurbanEventList } from '@/hooks/useQurbanEvents'
import {
  useCouponByToken,
  useRedeemCouponByToken,
  useQurbanCouponsByEvent,
} from '@/hooks/useQurbanCoupons'
import type { QurbanCouponWithRecipient } from '@/types/qurban'

type ScanState = 'idle' | 'scanning' | 'result' | 'manual'

interface ScanResult {
  type: 'valid' | 'error' | 'warning'
  coupon?: QurbanCouponWithRecipient
  errorCode?: string
  message?: string
}

// ---- Helper: parse validation error ----
function validateCoupon(
  coupon: QurbanCouponWithRecipient | null | undefined,
  selectedEventId: string | null
): ScanResult {
  if (!coupon) {
    return { type: 'error', errorCode: 'NOT_FOUND', message: 'Kupon tidak valid atau tidak ditemukan' }
  }
  if (coupon.status === 'redeemed') {
    const redeemedAt = coupon.redeemed_at
      ? format(new Date(coupon.redeemed_at), 'dd MMMM yyyy, HH:mm', { locale: id })
      : '-'
    return {
      type: 'warning',
      coupon,
      errorCode: 'ALREADY_REDEEMED',
      message: `Kupon ini sudah pernah ditebus pada ${redeemedAt}`,
    }
  }
  if (coupon.status === 'cancelled') {
    return { type: 'error', coupon, errorCode: 'CANCELLED', message: 'Kupon sudah dibatalkan' }
  }
  if (new Date(coupon.expires_at) < new Date()) {
    return { type: 'error', coupon, errorCode: 'EXPIRED', message: 'Kupon sudah kedaluwarsa' }
  }
  if (selectedEventId && coupon.event_id !== selectedEventId) {
    return {
      type: 'error',
      coupon,
      errorCode: 'WRONG_EVENT',
      message: `Kupon bukan untuk event ini. Kupon ini untuk event: ${coupon.qurban_event?.nama ?? coupon.event_id}`,
    }
  }
  return { type: 'valid', coupon }
}

// ---- Coupon result card ----
function CouponResultCard({
  result,
  onConfirm,
  onReset,
  isConfirming,
  showConfirm,
}: {
  result: ScanResult
  onConfirm?: () => void
  onReset: () => void
  isConfirming: boolean
  showConfirm: boolean
}) {
  const { coupon } = result
  const recipientName =
    coupon?.recipient_type === 'muzakki'
      ? (coupon.muzakki?.nama_kk ?? '-')
      : (coupon?.mustahik?.nama ?? '-')

  const animalInfo = coupon?.qurban_share
    ? `${coupon.qurban_share.qurban_animal?.jenis === 'sapi' ? 'Sapi' : 'Kambing'} #${coupon.qurban_share.qurban_animal?.nomor} · Slot ke-${coupon.qurban_share.urutan}`
    : undefined

  if (result.type === 'valid' && coupon) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">Kupon Valid</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">No. Kupon</span>
              <span className="font-mono font-bold">{coupon.coupon_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nama</span>
              <span className="font-medium text-right">{recipientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipe</span>
              <Badge variant="outline" className="text-xs">
                {coupon.recipient_type === 'muzakki' ? 'Muzakki' : 'Mustahik'}
              </Badge>
            </div>
            {animalInfo && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hewan</span>
                <span className="text-right">{animalInfo}</span>
              </div>
            )}
            {coupon.qurban_event && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Event</span>
                <span className="text-right">{coupon.qurban_event.nama}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Berlaku Hingga</span>
              <span className="text-right">
                {format(new Date(coupon.expires_at), 'dd MMM yyyy', { locale: id })}
              </span>
            </div>
          </div>
          {showConfirm && (
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={onConfirm}
                disabled={isConfirming}
              >
                {isConfirming ? 'Memproses...' : 'Konfirmasi Redemption'}
              </Button>
              <Button variant="outline" onClick={onReset}>
                Batal
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (result.type === 'warning') {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-yellow-700">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">Peringatan</span>
          </div>
          <p className="text-sm text-yellow-800">{result.message}</p>
          {coupon && (
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">No. Kupon</span>
                <span className="font-mono">{coupon.coupon_number}</span>
              </div>
            </div>
          )}
          <Button variant="outline" onClick={onReset} className="w-full">
            Scan Ulang
          </Button>
        </CardContent>
      </Card>
    )
  }

  // error
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-red-700">
          <XCircle className="h-5 w-5" />
          <span className="font-semibold">
            {result.errorCode === 'NOT_FOUND' ? 'Kupon Tidak Ditemukan' :
              result.errorCode === 'EXPIRED' ? 'Kupon Kedaluwarsa' :
              result.errorCode === 'CANCELLED' ? 'Kupon Dibatalkan' :
              result.errorCode === 'WRONG_EVENT' ? 'Event Tidak Sesuai' :
              'Kesalahan'}
          </span>
        </div>
        <p className="text-sm text-red-800">{result.message}</p>
        <Button variant="outline" onClick={onReset} className="w-full">
          Scan Ulang
        </Button>
      </CardContent>
    </Card>
  )
}

// ---- Success state ----
function SuccessCard({ couponNumber, onReset }: { couponNumber: string; onReset: () => void }) {
  return (
    <Card className="border-green-300 bg-green-100">
      <CardContent className="p-6 text-center space-y-3">
        <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
        <div>
          <p className="font-bold text-green-800 text-lg">Berhasil ditebus!</p>
          <p className="text-sm text-green-700 font-mono mt-1">{couponNumber}</p>
        </div>
        <Button onClick={onReset} className="bg-green-600 hover:bg-green-700">
          Scan Berikutnya
        </Button>
      </CardContent>
    </Card>
  )
}

// ---- Main Page ----
export function QurbanScan() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const initialEventId = searchParams.get('eventId')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialEventId)
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [scannedToken, setScannedToken] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [manualSearch, setManualSearch] = useState('')
  const [manualSearchDebounced, setManualSearchDebounced] = useState('')
  const [redeemConfirmOpen, setRedeemConfirmOpen] = useState(false)
  const [pendingManualCoupon, setPendingManualCoupon] = useState<QurbanCouponWithRecipient | null>(null)
  const [successCouponNumber, setSuccessCouponNumber] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerDivId = 'qurban-qr-reader'
  const alreadyScannedRef = useRef(false)

  const { data: events = [] } = useQurbanEventList()
  const redeemMutation = useRedeemCouponByToken()

  // Debounce manual search
  useEffect(() => {
    const timer = setTimeout(() => setManualSearchDebounced(manualSearch), 400)
    return () => clearTimeout(timer)
  }, [manualSearch])

  // Coupon lookup by scanned token
  const couponQuery = useCouponByToken(scannedToken)

  // When coupon query resolves, validate and set result
  useEffect(() => {
    if (!scannedToken) return
    if (couponQuery.isLoading) return
    if (couponQuery.error) {
      setScanResult({ type: 'error', errorCode: 'ERROR', message: 'Terjadi kesalahan saat membaca kupon' })
      return
    }
    const result = validateCoupon(couponQuery.data, selectedEventId)
    setScanResult(result)
  }, [couponQuery.data, couponQuery.isLoading, couponQuery.error, scannedToken, selectedEventId])

  // ---- Scanner control ----
  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop()
      } catch {
        // ignore stop errors
      }
    }
    scannerRef.current = null
  }, [])

  const startScanner = useCallback(async () => {
    if (!selectedEventId) {
      toast.warning('Pilih event terlebih dahulu')
      return
    }
    setCameraError(null)
    alreadyScannedRef.current = false

    try {
      const scanner = new Html5Qrcode(scannerDivId)
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (alreadyScannedRef.current) return
          alreadyScannedRef.current = true
          handleScanResult(decodedText)
        },
        undefined
      )
      setScanState('scanning')
    } catch (err: unknown) {
      const errorName = err instanceof Error ? err.name : ''
      const errorMsg = err instanceof Error ? err.message : String(err)
      if (errorName === 'NotAllowedError' || errorMsg.includes('NotAllowedError') || errorMsg.includes('Permission')) {
        setCameraError('Akses kamera ditolak. Gunakan fitur Cari Manual.')
      } else {
        setCameraError(`Gagal memulai kamera: ${errorMsg}`)
      }
      setScanState('idle')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId])

  const handleScanResult = useCallback(async (decodedText: string) => {
    await stopScanner()
    setScanState('result')
    setScanResult(null)
    setSuccessCouponNumber(null)
    setScannedToken(decodedText)
  }, [stopScanner])

  const handleReset = useCallback(async () => {
    await stopScanner()
    setScannedToken(null)
    setScanResult(null)
    setSuccessCouponNumber(null)
    alreadyScannedRef.current = false
    setScanState('idle')
  }, [stopScanner])

  const handleConfirmRedeem = async () => {
    if (!scannedToken || !selectedEventId || !scanResult?.coupon) return
    setIsConfirming(true)
    try {
      await redeemMutation.mutateAsync({ token: scannedToken, expectedEventId: selectedEventId })
      setSuccessCouponNumber(scanResult.coupon.coupon_number)
      setScanResult(null)
      setScannedToken(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error(`Gagal menebus kupon: ${msg}`)
    } finally {
      setIsConfirming(false)
    }
  }

  const handleManualConfirmRedeem = async () => {
    if (!pendingManualCoupon || !selectedEventId) return
    setIsConfirming(true)
    try {
      await redeemMutation.mutateAsync({ token: pendingManualCoupon.token, expectedEventId: selectedEventId })
      setSuccessCouponNumber(pendingManualCoupon.coupon_number)
      setPendingManualCoupon(null)
      setRedeemConfirmOpen(false)
      setManualSearch('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error(`Gagal menebus kupon: ${msg}`)
    } finally {
      setIsConfirming(false)
    }
  }

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [stopScanner])

  // ---- Manual search results ----
  const manualQuery = useQurbanCouponsByEvent(
    scanState === 'manual' ? selectedEventId : null,
    { page: 1, pageSize: 10 }
  )

  const filteredManualCoupons = manualQuery.data?.data?.filter((c) => {
    if (!manualSearchDebounced) return true
    const search = manualSearchDebounced.toLowerCase()
    return (
      c.coupon_number?.toLowerCase().includes(search) ||
      c.mustahik?.nama?.toLowerCase().includes(search) ||
      c.muzakki?.nama_kk?.toLowerCase().includes(search)
    )
  }) ?? []

  const toggleManual = async () => {
    if (scanState === 'manual') {
      await handleReset()
    } else {
      await stopScanner()
      setScannedToken(null)
      setScanResult(null)
      setSuccessCouponNumber(null)
      setScanState('manual')
      setManualSearch('')
    }
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-semibold text-base">Scan Kupon Qurban</h1>
          {selectedEvent && (
            <p className="text-xs text-muted-foreground">{selectedEvent.nama}</p>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Event selector */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Event Qurban</label>
          <Select
            value={selectedEventId ?? ''}
            onValueChange={(val) => {
              setSelectedEventId(val || null)
              handleReset()
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih event..." />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.nama} ({format(new Date(event.tanggal), 'dd MMM yyyy', { locale: id })})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!selectedEventId && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <ScanLine className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Pilih event terlebih dahulu untuk mulai scan</p>
            </CardContent>
          </Card>
        )}

        {selectedEventId && (
          <>
            {/* Camera / Scan section */}
            {scanState !== 'manual' && (
              <div className="space-y-3">
                {/* Camera viewport */}
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '280px' }}>
                  <div id={scannerDivId} className="w-full" />
                  {scanState === 'idle' && !cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white space-y-3">
                        <Camera className="h-12 w-12 mx-auto opacity-60" />
                        <p className="text-sm opacity-80">Tekan tombol di bawah untuk mulai scan</p>
                      </div>
                    </div>
                  )}
                  {cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                      <div className="text-center text-white space-y-3 p-4">
                        <CameraOff className="h-12 w-12 mx-auto opacity-60" />
                        <p className="text-sm opacity-90">{cameraError}</p>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={toggleManual}
                        >
                          Gunakan Cari Manual
                        </Button>
                      </div>
                    </div>
                  )}
                  {scanState === 'scanning' && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-600 text-white animate-pulse">
                        Scanning...
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Start/Stop button */}
                {(scanState === 'idle' || scanState === 'result') && !cameraError && (
                  <Button
                    className="w-full"
                    onClick={scanState === 'result' ? handleReset : startScanner}
                    disabled={!selectedEventId}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {scanState === 'result' ? 'Scan Ulang' : 'Mulai Scan'}
                  </Button>
                )}
                {scanState === 'scanning' && (
                  <Button variant="outline" className="w-full" onClick={handleReset}>
                    <CameraOff className="h-4 w-4 mr-2" />
                    Hentikan Scan
                  </Button>
                )}
              </div>
            )}

            {/* Result / Success area */}
            {successCouponNumber && (
              <SuccessCard couponNumber={successCouponNumber} onReset={handleReset} />
            )}

            {couponQuery.isLoading && scannedToken && !successCouponNumber && (
              <Card>
                <CardContent className="p-4 flex items-center gap-3 text-muted-foreground">
                  <Clock className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Mencari kupon...</span>
                </CardContent>
              </Card>
            )}

            {scanResult && !successCouponNumber && (
              <CouponResultCard
                result={scanResult}
                onConfirm={scanResult.type === 'valid' ? handleConfirmRedeem : undefined}
                onReset={handleReset}
                isConfirming={isConfirming}
                showConfirm={scanResult.type === 'valid'}
              />
            )}

            {/* Manual search toggle */}
            <Button
              variant={scanState === 'manual' ? 'secondary' : 'outline'}
              className="w-full"
              onClick={toggleManual}
            >
              <Search className="h-4 w-4 mr-2" />
              {scanState === 'manual' ? 'Tutup Cari Manual' : 'Cari Manual'}
            </Button>

            {/* Manual search panel */}
            {scanState === 'manual' && (
              <div className="space-y-3">
                {successCouponNumber && (
                  <SuccessCard couponNumber={successCouponNumber} onReset={() => { setSuccessCouponNumber(null); setManualSearch('') }} />
                )}
                <Input
                  placeholder="Cari no. kupon atau nama mustahik/muzakki..."
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                />
                {manualQuery.isLoading && (
                  <p className="text-sm text-muted-foreground text-center py-2">Memuat...</p>
                )}
                {!manualQuery.isLoading && manualSearchDebounced && filteredManualCoupons.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Tidak ada kupon yang cocok
                  </p>
                )}
                {filteredManualCoupons.map((coupon) => {
                  const recipientName =
                    coupon.recipient_type === 'muzakki'
                      ? (coupon.muzakki?.nama_kk ?? '-')
                      : (coupon.mustahik?.nama ?? '-')

                  const validation = validateCoupon(coupon, selectedEventId)
                  const isValid = validation.type === 'valid'

                  return (
                    <Card key={coupon.id} className={isValid ? 'border-green-200' : 'border-gray-200'}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-mono text-sm font-bold">{coupon.coupon_number}</p>
                            <p className="text-sm">{recipientName}</p>
                            <p className="text-xs text-muted-foreground">
                              {coupon.recipient_type === 'muzakki' ? 'Muzakki' : 'Mustahik'}
                            </p>
                          </div>
                          <div className="text-right">
                            {coupon.status === 'active' && new Date(coupon.expires_at) > new Date() ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aktif</Badge>
                            ) : coupon.status === 'redeemed' ? (
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Ditebus</Badge>
                            ) : coupon.status === 'cancelled' ? (
                              <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Dibatalkan</Badge>
                            ) : (
                              <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Kedaluwarsa</Badge>
                            )}
                          </div>
                        </div>
                        {!isValid && (
                          <p className="text-xs text-red-600">{validation.message}</p>
                        )}
                        {isValid && (
                          <Button
                            size="sm"
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setPendingManualCoupon(coupon)
                              setRedeemConfirmOpen(true)
                            }}
                          >
                            Konfirmasi Redemption
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
                {!manualSearchDebounced && !manualQuery.isLoading && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Ketik untuk mencari kupon...
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Manual redemption confirm dialog */}
      <AlertDialog open={redeemConfirmOpen} onOpenChange={setRedeemConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Redemption</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menebus kupon{' '}
              <strong>{pendingManualCoupon?.coupon_number}</strong> atas nama{' '}
              <strong>
                {pendingManualCoupon?.recipient_type === 'muzakki'
                  ? pendingManualCoupon?.muzakki?.nama_kk
                  : pendingManualCoupon?.mustahik?.nama}
              </strong>
              ? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirming}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleManualConfirmRedeem}
              disabled={isConfirming}
              className="bg-green-600 hover:bg-green-700"
            >
              {isConfirming ? 'Memproses...' : 'Ya, Konfirmasi'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default QurbanScan
