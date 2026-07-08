import * as THREE from 'three'

// Procedural CanvasTextures — no binary assets to load, blueprint style stays
// crisp at any DPI, and the whole "model" ships inside the JS bundle.

const INK = '#1e3a5f'
const FAINT = 'rgba(30,58,95,0.35)'
const BRAND = '#1d4ed8'

/** Front face of the permit document: header, ruled fields, plan sketch. */
export function makeDocumentTexture(): THREE.CanvasTexture {
  const w = 1024
  const h = 1366
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!

  ctx.fillStyle = '#fdfefe'
  ctx.fillRect(0, 0, w, h)

  // outer rule
  ctx.strokeStyle = FAINT
  ctx.lineWidth = 3
  ctx.strokeRect(46, 46, w - 92, h - 92)

  // header
  ctx.fillStyle = INK
  ctx.font = '700 54px "Helvetica Neue", Arial, sans-serif'
  ctx.fillText('BUILDING PERMIT', 92, 150)
  ctx.font = '700 54px "Helvetica Neue", Arial, sans-serif'
  ctx.fillText('APPLICATION', 92, 214)
  ctx.font = '400 30px "Helvetica Neue", Arial, sans-serif'
  ctx.fillStyle = 'rgba(30,58,95,0.7)'
  ctx.fillText('Commonwealth of Massachusetts', 92, 268)

  ctx.strokeStyle = FAINT
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(92, 300)
  ctx.lineTo(w - 92, 300)
  ctx.stroke()

  // labelled field rows
  const fields = [
    'PROJECT DESCRIPTION',
    'PROPERTY ADDRESS',
    'PERMIT TYPE',
    'ESTIMATED VALUE',
  ]
  let y = 372
  for (const label of fields) {
    ctx.fillStyle = 'rgba(30,58,95,0.55)'
    ctx.font = '600 24px "Helvetica Neue", Arial, sans-serif'
    ctx.fillText(label, 92, y)
    ctx.strokeStyle = FAINT
    ctx.beginPath()
    ctx.moveTo(92, y + 44)
    ctx.lineTo(w - 92, y + 44)
    ctx.stroke()
    y += 118
  }

  // blueprint plan sketch (dashed deck footprint)
  const bx = 92
  const by = y - 20
  const bw = w - 184
  const bh = 330
  ctx.fillStyle = 'rgba(29,78,216,0.05)'
  ctx.fillRect(bx, by, bw, bh)
  ctx.strokeStyle = 'rgba(29,78,216,0.5)'
  ctx.lineWidth = 2.5
  ctx.strokeRect(bx, by, bw, bh)
  ctx.setLineDash([14, 10])
  ctx.strokeRect(bx + 70, by + 60, bw * 0.42, bh - 120)
  ctx.strokeRect(bx + 70 + bw * 0.5, by + 60, bw * 0.3, bh * 0.45)
  ctx.setLineDash([])
  // dimension arrows
  ctx.strokeStyle = 'rgba(29,78,216,0.65)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(bx + 70, by + bh - 34)
  ctx.lineTo(bx + 70 + bw * 0.42, by + bh - 34)
  ctx.stroke()
  ctx.font = '500 22px "Helvetica Neue", Arial, sans-serif'
  ctx.fillStyle = 'rgba(29,78,216,0.8)'
  ctx.fillText("24'-0\"", bx + 70 + bw * 0.18, by + bh - 44)

  // footer rows
  let fy = by + bh + 84
  ctx.fillStyle = 'rgba(30,58,95,0.55)'
  ctx.font = '600 24px "Helvetica Neue", Arial, sans-serif'
  ctx.fillText('APPLICANT SIGNATURE', 92, fy)
  ctx.fillText('DATE', w - 340, fy)
  ctx.strokeStyle = FAINT
  ctx.beginPath()
  ctx.moveTo(92, fy + 44)
  ctx.lineTo(w - 420, fy + 44)
  ctx.moveTo(w - 340, fy + 44)
  ctx.lineTo(w - 92, fy + 44)
  ctx.stroke()
  // signature squiggle
  ctx.strokeStyle = 'rgba(30,58,95,0.8)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(110, fy + 36)
  ctx.bezierCurveTo(180, fy - 14, 240, fy + 52, 320, fy + 12)
  ctx.bezierCurveTo(380, fy - 12, 430, fy + 40, 500, fy + 20)
  ctx.stroke()

  fy += 118
  ctx.fillStyle = 'rgba(30,58,95,0.4)'
  ctx.font = '400 22px "Helvetica Neue", Arial, sans-serif'
  ctx.fillText('Form PIQ-780 · Uniform Application per 780 CMR', 92, fy)

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/** Circular "PERMIT READY" stamp, drawn at an angle-friendly square size. */
export function makeStampTexture(): THREE.CanvasTexture {
  const s = 512
  const c = document.createElement('canvas')
  c.width = s
  c.height = s
  const ctx = c.getContext('2d')!
  const cx = s / 2

  ctx.strokeStyle = BRAND
  ctx.lineWidth = 10
  ctx.beginPath()
  ctx.arc(cx, cx, 226, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(cx, cx, 196, 0, Math.PI * 2)
  ctx.stroke()

  ctx.fillStyle = BRAND
  ctx.font = '800 74px "Helvetica Neue", Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('PERMIT', cx, cx - 10)
  ctx.fillText('READY', cx, cx + 70)

  // curved top/bottom text
  ctx.font = '700 34px "Helvetica Neue", Arial, sans-serif'
  const arcText = (text: string, radius: number, start: number, dir: 1 | -1) => {
    const step = 0.155 * dir
    let a = start
    for (const ch of text) {
      ctx.save()
      ctx.translate(cx + Math.cos(a) * radius, cx + Math.sin(a) * radius)
      ctx.rotate(a + (dir === 1 ? Math.PI / 2 : -Math.PI / 2))
      ctx.fillText(ch, 0, 0)
      ctx.restore()
      a += step
    }
  }
  arcText('PERMITIQ', 156, -Math.PI / 2 - 0.55, 1)
  arcText('VERIFIED', 156, Math.PI / 2 + 0.55, -1)

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Small translucent field chip (label + value), used when the doc breaks apart. */
export function makeChipTexture(label: string, value: string): THREE.CanvasTexture {
  const w = 512
  const h = 256
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!

  const r = 28
  ctx.beginPath()
  ctx.roundRect(6, 6, w - 12, h - 12, r)
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(29,78,216,0.45)'
  ctx.lineWidth = 4
  ctx.stroke()

  ctx.fillStyle = 'rgba(30,58,95,0.55)'
  ctx.font = '700 34px "Helvetica Neue", Arial, sans-serif'
  ctx.fillText(label.toUpperCase(), 44, 92)
  ctx.fillStyle = INK
  ctx.font = '700 52px "Helvetica Neue", Arial, sans-serif'
  ctx.fillText(value, 44, 172)

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
