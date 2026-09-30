import type { ThemeColors, ThemeId } from './themes'
import { THEMES, colorsFromMain, normalizeHex } from './themes'

const STORAGE_KEY = 'shukkin-calendar-v2'

export type StoredPrefs = {
  themeId: ThemeId
  colors: ThemeColors
  name: string
  shop: string
  calendarHeight: number
  darkness: number
  photoOffset: number
}

export const DEFAULT_PREFS: StoredPrefs = {
  themeId: 'sakura',
  colors: {
    main: THEMES[0].main,
    accent: THEMES[0].accent,
    title: THEMES[0].title,
  },
  name: '',
  shop: '',
  calendarHeight: 0.42,
  darkness: 0.25,
  photoOffset: 0.5,
}

const THEME_IDS: ThemeId[] = ['sakura', 'blue', 'gold', 'purple', 'mint', 'custom']

function readColors(raw: unknown, fallback: ThemeColors): ThemeColors {
  if (!raw || typeof raw !== 'object') return { ...fallback }
  const c = raw as Partial<ThemeColors>
  return {
    main: normalizeHex(typeof c.main === 'string' ? c.main : fallback.main, fallback.main),
    accent: normalizeHex(typeof c.accent === 'string' ? c.accent : fallback.accent, fallback.accent),
    title: normalizeHex(typeof c.title === 'string' ? c.title : fallback.title, fallback.title),
  }
}

export function loadPrefs(): StoredPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('shukkin-calendar-v1')
    if (!raw) return { ...DEFAULT_PREFS, colors: { ...DEFAULT_PREFS.colors } }
    const parsed = JSON.parse(raw) as Partial<StoredPrefs> & { customColor?: string }
    const themeId = THEME_IDS.includes(parsed.themeId as ThemeId)
      ? (parsed.themeId as ThemeId)
      : DEFAULT_PREFS.themeId

    let colors = readColors(parsed.colors, DEFAULT_PREFS.colors)

    if (!parsed.colors && typeof parsed.customColor === 'string') {
      const preset = THEMES.find((t) => t.id === themeId)
      if (themeId === 'custom' || !preset) {
        colors = colorsFromMain(parsed.customColor)
      } else {
        colors = { main: preset.main, accent: preset.accent, title: preset.title }
      }
    } else if (!parsed.colors && themeId !== 'custom') {
      const preset = THEMES.find((t) => t.id === themeId)
      if (preset) {
        colors = { main: preset.main, accent: preset.accent, title: preset.title }
      }
    }

    return {
      themeId,
      colors,
      name: parsed.name ?? '',
      shop: parsed.shop ?? '',
      calendarHeight: clamp(parsed.calendarHeight ?? DEFAULT_PREFS.calendarHeight, 0.28, 0.62),
      darkness: clamp(parsed.darkness ?? DEFAULT_PREFS.darkness, 0, 0.6),
      photoOffset: clamp(parsed.photoOffset ?? DEFAULT_PREFS.photoOffset, 0, 1),
    }
  } catch {
    return { ...DEFAULT_PREFS, colors: { ...DEFAULT_PREFS.colors } }
  }
}

export function savePrefs(prefs: StoredPrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // ignore quota / private mode
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}
