import type { ThemeId } from './themes'

const STORAGE_KEY = 'shukkin-calendar-v1'

export type StoredPrefs = {
  themeId: ThemeId
  name: string
  shop: string
  calendarHeight: number
  darkness: number
  photoOffset: number
}

export const DEFAULT_PREFS: StoredPrefs = {
  themeId: 'sakura',
  name: '',
  shop: '',
  calendarHeight: 0.42,
  darkness: 0.25,
  photoOffset: 0.5,
}

export function loadPrefs(): StoredPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    const parsed = JSON.parse(raw) as Partial<StoredPrefs>
    return {
      themeId: parsed.themeId ?? DEFAULT_PREFS.themeId,
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
