export interface ThermalCouponRow {
  label: string
  value: string
}

export interface ThermalCouponData {
  qrSvgElement: SVGElement
  couponNumber: string
  couponType: 'muzakki' | 'mustahik'
  mosqueName: string
  rows: ThermalCouponRow[]
}

export function printThermalCoupon(data: ThermalCouponData): void {
  // Clone SVG and strip fixed width/height so CSS controls the size
  const svgClone = data.qrSvgElement.cloneNode(true) as SVGElement
  svgClone.removeAttribute('width')
  svgClone.removeAttribute('height')
  const svgStr = new XMLSerializer().serializeToString(svgClone)

  const title =
    data.couponType === 'muzakki'
      ? 'Bukti Pendaftaran Qurban'
      : 'Kupon Distribusi Daging Qurban'

  const rowsHtml = data.rows
    .map(
      r =>
        `<div class="row"><span class="lbl">${esc(r.label)}</span><span class="sep">:</span><span class="val">${esc(r.value)}</span></div>`
    )
    .join('')

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>Kupon Thermal</title>
<style>
@page { size: 58mm auto; margin: 3mm 3mm 5mm 3mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  width: 52mm;
  font-family: 'Courier New', Courier, monospace;
  color: #000;
  background: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.header { text-align: center; padding-bottom: 1mm; }
.org { font-size: 9pt; font-weight: bold; }
.subtitle { font-size: 7pt; margin-top: 1mm; }
hr.s { border: none; border-top: 1px solid #000; margin: 2mm 0; }
hr.d { border: none; border-top: 1px dashed #000; margin: 2mm 0; }
.qr { text-align: center; }
.qr svg { display: block; width: 44mm; height: 44mm; margin: 0 auto; }
.num { text-align: center; font-size: 9pt; font-weight: bold; letter-spacing: 2px; margin: 1.5mm 0; }
.rows { margin: 1mm 0; }
.row { display: flex; font-size: 7pt; line-height: 1.6; }
.lbl { width: 20mm; flex-shrink: 0; }
.sep { width: 3mm; flex-shrink: 0; }
.val { flex: 1; font-weight: bold; word-break: break-word; }
.footer { text-align: center; font-size: 6.5pt; font-style: italic; margin-top: 2mm; }
@media screen { body { margin: 8px; } }
</style>
</head>
<body>
<div class="header">
  <div class="org">${esc(data.mosqueName)}</div>
  <div class="subtitle">${title}</div>
</div>
<hr class="s">
<div class="qr">${svgStr}</div>
<hr class="d">
<div class="num">${esc(data.couponNumber)}</div>
<hr class="d">
<div class="rows">${rowsHtml}</div>
<hr class="s">
<div class="footer">Tunjukkan kupon ini saat pengambilan daging</div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=300,height=500,toolbar=0,menubar=0,scrollbars=1')
  if (!win) {
    alert('Popup diblokir. Izinkan popup untuk halaman ini agar bisa mencetak kupon.')
    return
  }
  win.document.write(html)
  win.document.close()
  win.focus()
  // Brief delay to ensure SVG is rendered before print dialog opens
  setTimeout(() => win.print(), 150)
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
