/** Draw text with manual letter-spacing (Canvas has no CSS letter-spacing). */
export function fillTextSpaced(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacing: number,
  align: CanvasTextAlign = 'left',
) {
  const chars = [...text]
  if (chars.length === 0) return

  let totalWidth = 0
  const widths: number[] = []
  for (const ch of chars) {
    const w = ctx.measureText(ch).width
    widths.push(w)
    totalWidth += w
  }
  if (chars.length > 1) {
    totalWidth += letterSpacing * (chars.length - 1)
  }

  let startX = x
  if (align === 'center') startX = x - totalWidth / 2
  else if (align === 'right') startX = x - totalWidth

  let cursor = startX
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], cursor, y)
    cursor += widths[i] + letterSpacing
  }
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
