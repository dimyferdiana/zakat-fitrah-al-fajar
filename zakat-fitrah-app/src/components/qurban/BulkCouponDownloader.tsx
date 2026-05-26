import { useEffect, useRef } from 'react'
import JSZip from 'jszip'
import { exportCouponImage } from '@/lib/couponExport'
import { CouponShareImage } from '@/components/qurban/CouponShareImage'
import type { QurbanCoupon } from '@/types/qurban'

export interface BulkDownloadItem {
  coupon: QurbanCoupon
  recipientName: string
  eventName: string
}

interface BulkCouponDownloaderProps {
  items: BulkDownloadItem[]
  onProgress: (done: number, total: number) => void
  onDone: () => void
}

export function BulkCouponDownloader({ items, onProgress, onDone }: BulkCouponDownloaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current || !containerRef.current || items.length === 0) return
    started.current = true

    const container = containerRef.current

    async function run() {
      const zip = new JSZip()
      const cards = container.querySelectorAll<HTMLDivElement>('[data-coupon-card]')
      const arr = Array.from(cards)

      for (let i = 0; i < arr.length; i++) {
        try {
          const blob = await exportCouponImage(arr[i])
          zip.file(`kupon-${items[i].coupon.coupon_number}.png`, blob)
        } catch {
          // skip failed coupon, continue
        }
        onProgress(i + 1, arr.length)
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const eventName = items[0]?.eventName ?? 'kupon'
      const safeName = eventName.replace(/[^a-zA-Z0-9-_]/g, '_')
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kupon-${safeName}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      onDone()
    }

    run()
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden
      style={{
        position: 'fixed',
        left: '-9999px',
        top: 0,
        zIndex: -1,
        pointerEvents: 'none',
      }}
    >
      {items.map((item) => (
        <div key={item.coupon.id} data-coupon-card>
          <CouponShareImage
            coupon={item.coupon}
            recipientName={item.recipientName}
            eventName={item.eventName}
          />
        </div>
      ))}
    </div>
  )
}
