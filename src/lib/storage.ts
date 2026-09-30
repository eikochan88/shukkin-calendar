import type { ThemeId } from './themes'

const STORAGE_KEY = 'shukkin-calendar-v1'

export type StoredPrefs = {
  themeId: ThemeId
  customColor: string
  name: string
  shop: string
  calendarHeight: number
  darkness: number
  photoOffset: number
}

export const DEFAULT_PREFS: StoredPrefs = {
  themeId: 'sakura',
  customColor: '#e39bae',
  name: '',
  shop: '',
  calendarHeight: 0.42,
  darkness: 0.25,
  photoOffset: 0.5,
}

const THEME_IDS: ThemeId[] = ['sakura', 'blue', 'gold', 'purple', 'mint', 'custom']

export function loadPrefs(): StoredPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    const parsed = JSON.parse(raw) as Partial<StoredPrefs>
    const themeId = THEME_IDS.includes(parsed.themeId as ThemeId)
      ? (parsed.themeId as ThemeId)
      : DEFAULT_PREFS.themeId
    return {
      themeId,
      customColor:
        typeof parsed.customColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(parsed.customColor)
          ? parsed.customColor
          : DEFAULT_PREFS.customColor,
      name: parsed.name ?? '',
      shop: parsed.shop ?? '',
      calendarHeight: clamp(parsed.calendarHeight ?? DEFAULT_PREFS.calendarHeight, 0.28, 0.62),
      darkness: clamp(parsed.darkness ?? DEFAULT_PREFS.darkness, 0, 0.6),
      photoOffset: clamp(parsed.photoOffset ?? DEFAULT_PREFS.photoOffset, 0, 1),
    }
  } catch {
    return { ...DEFAULT_PREFS }
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
