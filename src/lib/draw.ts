import { fillTextSpaced, hexToRgba } from './canvas-utils'
import {
  CANVAS_H,
  CANVAS_W,
  MONTH_NAMES,
  SANS,
  SERIF,
  WEEKDAYS,
  type Theme,
} from './themes'

export type DrawOptions = {
  theme: Theme
  year: number
  month: number // 1-12
  workDays: Set<number>
  name: string
  shop: string
  calendarHeight: number // 0-1
  darkness: number // 0-0.6
  photoOffset: number // 0-1 (vertical)
  photo: HTMLImageElement | null
}

export function drawCalendar(ctx: CanvasRenderingContext2D, opts: DrawOptions) {
  const {
    theme,
    year,
    month,
    workDays,
    name,
    shop,
    calendarHeight,
    darkness,
    photoOffset,
    photo,
  } = opts

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

  // Background
  if (photo) {
    const scale = Math.max(CANVAS_W / photo.naturalWidth, CANVAS_H / photo.naturalHeight)
    const dw = photo.naturalWidth * scale
    const dh = photo.naturalHeight * scale
    const dx = (CANVAS_W - dw) / 2
    // photoOffset 0 = top-aligned, 1 = bottom-aligned
    const maxDy = Math.min(0, CANVAS_H - dh)
    const dy = maxDy * photoOffset
    ctx.drawImage(photo, dx, dy, dw, dh)
  } else {
    const grad = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H)
    grad.addColorStop(0, theme.main)
    grad.addColorStop(0.55, theme.accent)
    grad.addColorStop(1, theme.title)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
  }

  // Darkness overlay
  if (darkness > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${darkness})`
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
  }

  // Large month number (top-left)
  const monthStr = String(month).padStart(2, '0')
  ctx.save()
  ctx.font = `300 260px ${SERIF}`
  ctx.fillStyle = hexToRgba(theme.title, 0.92)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
  ctx.shadowBlur = 18
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 6
  ctx.fillText(monthStr, 56, 300)
  ctx.restore()

  // Calendar block
  const blockY = CANVAS_H * calendarHeight

  // Month name (e.g. MARCH)
  ctx.save()
  ctx.font = `400 66px ${SERIF}`
  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'alphabetic'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
  ctx.shadowBlur = 10
  fillTextSpaced(ctx, MONTH_NAMES[month - 1], CANVAS_W / 2, blockY, 8, 'center')
  ctx.restore()

  // CALENDAR
  ctx.save()
  ctx.font = `400 66px ${SERIF}`
  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'alphabetic'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
  ctx.shadowBlur = 10
  fillTextSpaced(ctx, 'CALENDAR', CANVAS_W / 2, blockY + 74, 8, 'center')
  ctx.restore()

  // 出勤カレンダー
  ctx.save()
  ctx.font = `500 26px ${SANS}`
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
  ctx.shadowBlur = 8
  ctx.fillText('出勤カレンダー', CANVAS_W / 2, blockY + 74 + 50)
  ctx.restore()

  // Weekday pills
  const pillY = blockY + 74 + 50 + 36
  const sideMargin = 66
  const pillW = 92
  const pillH = 34
  const available = CANVAS_W - sideMargin * 2
  const gap = (available - pillW * 7) / 6

  ctx.save()
  ctx.font = `600 24px ${SANS}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < 7; i++) {
    const px = sideMargin + i * (pillW + gap)
    const isWeekend = i === 0 || i === 6
    ctx.fillStyle = isWeekend ? theme.accent : theme.main
    roundRect(ctx, px, pillY, pillW, pillH, 8)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.fillText(WEEKDAYS[i], px + pillW / 2, pillY + pillH / 2 + 1)
  }
  ctx.restore()

  // Date grid
  const firstDow = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const rowH = 94
  const gridTop = pillY + pillH + 28
  const cellW = available / 7

  ctx.save()
  ctx.font = `500 28px ${SANS}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let day = 1; day <= daysInMonth; day++) {
    const idx = firstDow + day - 1
    const col = idx % 7
    const row = Math.floor(idx / 7)
    const cx = sideMargin + col * cellW + cellW / 2
    const cy = gridTop + row * rowH + rowH / 2

    if (workDays.has(day)) {
      ctx.beginPath()
      ctx.arc(cx, cy, 36, 0, Math.PI * 2)
      ctx.fillStyle = hexToRgba(theme.main, 0.92)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.fillText(String(day), cx, cy + 1)
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
      ctx.fillText(String(day), cx, cy + 1)
    }
  }
  ctx.restore()

  // Name / shop
  const rows = Math.ceil((firstDow + daysInMonth) / 7)
  const footerY = gridTop + rows * rowH + 20

  ctx.save()
  ctx.font = `400 22px ${SANS}`
  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
  ctx.shadowBlur = 6

  const lines: string[] = []
  if (name.trim()) lines.push(name.trim())
  if (shop.trim()) lines.push(shop.trim())
  lines.forEach((line, i) => {
    ctx.fillText(line, CANVAS_W / 2, footerY + i * 32)
  })
  ctx.restore()
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}
