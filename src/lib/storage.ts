import type { ThemeColors, ThemeId } from './themes'
import { THEMES, colorsFromMain, normalizeHex, pickThemeColors } from './themes'

const STORAGE_KEY = 'shukkin-calendar-v3'

export type PhotoFit = 'cover' | 'contain'

export type StoredPrefs = {
  themeId: ThemeId
  colors: ThemeColors
  name: string
  shop: string
  calendarHeight: number
  darkness: number
  photoOffset: number
  centerTextSize: number
  photoBgColor: string
  photoFit: PhotoFit
  photoBrightness: number
  photoContrast: number
  photoSaturate: number
  photoBlur: number
  photoZoom: number
}

const base = THEMES[0]

export const DEFAULT_PREFS: StoredPrefs = {
  themeId: 'sakura',
  colors: pickThemeColors(base),
  name: '',
  shop: '',
  calendarHeight: 0.42,
  darkness: 0.25,
  photoOffset: 0.5,
  centerTextSize: 1,
  photoBgColor: '#1a1520',
  photoFit: 'cover',
  photoBrightness: 1,
  photoContrast: 1,
  photoSaturate: 1,
  photoBlur: 0,
  photoZoom: 1,
}

const THEME_IDS: ThemeId[] = ['sakura', 'blue', 'gold', 'purple', 'mint', 'custom']

function readColors(raw: unknown, fallback: ThemeColors): ThemeColors {
  if (!raw || typeof raw !== 'object') return { ...fallback }
  const c = raw as Partial<ThemeColors>
  const main = normalizeHex(typeof c.main === 'string' ? c.main : fallback.main, fallback.main)
  const accent = normalizeHex(
    typeof c.accent === 'string' ? c.accent : fallback.accent,
    fallback.accent,
  )
  const text = normalizeHex(typeof c.text === 'string' ? c.text : fallback.text, fallback.text)
  return {
    main,
    accent,
    title: normalizeHex(typeof c.title === 'string' ? c.title : fallback.title, fallback.title),
    text,
    centerText: normalizeHex(
      typeof c.centerText === 'string' ? c.centerText : text,
      fallback.centerText,
    ),
    weekday: normalizeHex(
      typeof c.weekday === 'string' ? c.weekday : main,
      fallback.weekday,
    ),
    weekend: normalizeHex(
      typeof c.weekend === 'string' ? c.weekend : accent,
      fallback.weekend,
    ),
  }
}

function cloneDefaults(): StoredPrefs {
  return { ...DEFAULT_PREFS, colors: { ...DEFAULT_PREFS.colors } }
}

export function loadPrefs(): StoredPrefs {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem('shukkin-calendar-v2') ??
      localStorage.getItem('shukkin-calendar-v1')
    if (!raw) return cloneDefaults()
    const parsed = JSON.parse(raw) as Partial<StoredPrefs> & { customColor?: string }
    const themeId = THEME_IDS.includes(parsed.themeId as ThemeId)
      ? (parsed.themeId as ThemeId)
      : DEFAULT_PREFS.themeId

    let colors = readColors(parsed.colors, DEFAULT_PREFS.colors)

    if (!parsed.colors && typeof parsed.customColor === 'string') {
      const preset = THEMES.find((t) => t.id === themeId)
      colors =
        themeId === 'custom' || !preset
          ? colorsFromMain(parsed.customColor)
          : pickThemeColors(preset)
    } else if (!parsed.colors && themeId !== 'custom') {
      const preset = THEMES.find((t) => t.id === themeId)
      if (preset) colors = pickThemeColors(preset)
    }

    const photoFit: PhotoFit = parsed.photoFit === 'contain' ? 'contain' : 'cover'

    return {
      themeId,
      colors,
      name: parsed.name ?? '',
      shop: parsed.shop ?? '',
      calendarHeight: clamp(parsed.calendarHeight ?? DEFAULT_PREFS.calendarHeight, 0.28, 0.62),
      darkness: clamp(parsed.darkness ?? DEFAULT_PREFS.darkness, 0, 0.6),
      photoOffset: clamp(parsed.photoOffset ?? DEFAULT_PREFS.photoOffset, 0, 1),
      centerTextSize: clamp(parsed.centerTextSize ?? DEFAULT_PREFS.centerTextSize, 0.6, 1.6),
      photoBgColor: normalizeHex(
        typeof parsed.photoBgColor === 'string' ? parsed.photoBgColor : DEFAULT_PREFS.photoBgColor,
        DEFAULT_PREFS.photoBgColor,
      ),
      photoFit,
      photoBrightness: clamp(parsed.photoBrightness ?? DEFAULT_PREFS.photoBrightness, 0.4, 1.8),
      photoContrast: clamp(parsed.photoContrast ?? DEFAULT_PREFS.photoContrast, 0.4, 1.8),
      photoSaturate: clamp(parsed.photoSaturate ?? DEFAULT_PREFS.photoSaturate, 0, 2.5),
      photoBlur: clamp(parsed.photoBlur ?? DEFAULT_PREFS.photoBlur, 0, 12),
      photoZoom: clamp(parsed.photoZoom ?? DEFAULT_PREFS.photoZoom, 1, 2.2),
    }
  } catch {
    return cloneDefaults()
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
