export type ThemeId = 'sakura' | 'blue' | 'gold' | 'purple' | 'mint' | 'custom'

export type ThemeColors = {
  main: string
  accent: string
  title: string
  text: string
  centerText: string
  weekday: string
  weekend: string
}

export type Theme = ThemeColors & {
  id: ThemeId
  label: string
}

export const THEMES: Theme[] = [
  {
    id: 'sakura',
    label: 'サクラ',
    main: '#e39bae',
    accent: '#9cb4e4',
    title: '#a9c0ec',
    text: '#ffffff',
    centerText: '#ffffff',
    weekday: '#e39bae',
    weekend: '#9cb4e4',
  },
  {
    id: 'blue',
    label: 'ブルー',
    main: '#8fb0dd',
    accent: '#c9d6ec',
    title: '#b8cbe9',
    text: '#ffffff',
    centerText: '#ffffff',
    weekday: '#8fb0dd',
    weekend: '#c9d6ec',
  },
  {
    id: 'gold',
    label: 'ゴールド',
    main: '#c9a86a',
    accent: '#e6d5ae',
    title: '#e0cb9c',
    text: '#ffffff',
    centerText: '#ffffff',
    weekday: '#c9a86a',
    weekend: '#e6d5ae',
  },
  {
    id: 'purple',
    label: 'パープル',
    main: '#a487c9',
    accent: '#d3b8e6',
    title: '#cbb2e6',
    text: '#ffffff',
    centerText: '#ffffff',
    weekday: '#a487c9',
    weekend: '#d3b8e6',
  },
  {
    id: 'mint',
    label: 'ミント',
    main: '#8ec7bb',
    accent: '#bfe0d8',
    title: '#b3ded3',
    text: '#ffffff',
    centerText: '#ffffff',
    weekday: '#8ec7bb',
    weekend: '#bfe0d8',
  },
]

function clampByte(n: number) {
  return Math.min(255, Math.max(0, Math.round(n)))
}

function mixHex(hex: string, toward: number, amount: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const r = Number.parseInt(full.slice(0, 2), 16)
  const g = Number.parseInt(full.slice(2, 4), 16)
  const b = Number.parseInt(full.slice(4, 6), 16)
  const nr = clampByte(r + (toward - r) * amount)
  const ng = clampByte(g + (toward - g) * amount)
  const nb = clampByte(b + (toward - b) * amount)
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`
}

export function normalizeHex(input: string, fallback = '#e39bae'): string {
  const raw = input.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toLowerCase()
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toLowerCase()}`
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    const h = raw.slice(1)
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase()
  }
  return fallback
}

/** 1色から全体カラーを作る */
export function colorsFromMain(main: string): ThemeColors {
  const safe = normalizeHex(main)
  const accent = mixHex(safe, 255, 0.35)
  return {
    main: safe,
    accent,
    title: mixHex(safe, 255, 0.22),
    text: '#ffffff',
    centerText: '#ffffff',
    weekday: safe,
    weekend: accent,
  }
}

export function themeFromColors(colors: ThemeColors): Theme {
  return {
    id: 'custom',
    label: 'カスタム',
    main: normalizeHex(colors.main),
    accent: normalizeHex(colors.accent, '#9cb4e4'),
    title: normalizeHex(colors.title, '#a9c0ec'),
    text: normalizeHex(colors.text, '#ffffff'),
    centerText: normalizeHex(colors.centerText ?? colors.text, '#ffffff'),
    weekday: normalizeHex(colors.weekday ?? colors.main, colors.main),
    weekend: normalizeHex(colors.weekend ?? colors.accent, colors.accent),
  }
}

export function getTheme(id: ThemeId): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}

export function pickThemeColors(theme: Theme): ThemeColors {
  return {
    main: theme.main,
    accent: theme.accent,
    title: theme.title,
    text: theme.text,
    centerText: theme.centerText,
    weekday: theme.weekday,
    weekend: theme.weekend,
  }
}

export const MONTH_NAMES = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
] as const

export const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const

export const CANVAS_W = 1080
export const CANVAS_H = 1350

export const SERIF =
  'Didot, "Bodoni MT", "Bodoni 72", "Times New Roman", serif'
export const SANS =
  '"Helvetica Neue", "Hiragino Sans", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif'
