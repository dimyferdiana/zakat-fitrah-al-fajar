import html2canvas from 'html2canvas'

export async function exportCouponImage(element: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  })

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error('Failed to generate image')); return }
        // Warn in console if over 500KB but don't fail
        if (blob.size > 500 * 1024) {
          console.warn(`Coupon image is ${Math.round(blob.size / 1024)}KB — consider reducing scale`)
        }
        resolve(blob)
      },
      'image/png',
      0.92
    )
  })
}

export async function shareCouponImage(
  element: HTMLElement,
  filename: string = 'kupon-qurban.png'
): Promise<void> {
  const blob = await exportCouponImage(element)
  const file = new File([blob], filename, { type: 'image/png' })

  // Try Web Share API first (mobile)
  if (navigator.share && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: 'Kupon Qurban',
    })
    return
  }

  // Desktop fallback: download
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
