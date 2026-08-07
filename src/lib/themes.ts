export type ThemeId = 'sakura' | 'blue' | 'gold' | 'purple' | 'mint'

export type Theme = {
  id: ThemeId
  label: string
  main: string
  accent: string
  title: string
}

export const THEMES: Theme[] = [
  { id: 'sakura', label: 'サクラ', main: '#e39bae', accent: '#9cb4e4', title: '#a9c0ec' },
  { id: 'blue', label: 'ブルー', main: '#8fb0dd', accent: '#c9d6ec', title: '#b8cbe9' },
  { id: 'gold', label: 'ゴールド', main: '#c9a86a', accent: '#e6d5ae', title: '#e0cb9c' },
  { id: 'purple', label: 'パープル', main: '#a487c9', accent: '#d3b8e6', title: '#cbb2e6' },
  { id: 'mint', label: 'ミント', main: '#8ec7bb', accent: '#bfe0d8', title: '#b3ded3' },
]

export function getTheme(id: ThemeId): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
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
