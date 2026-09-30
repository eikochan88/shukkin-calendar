import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { drawCalendar } from './lib/draw'
import { saveCanvasImage } from './lib/save'
import { loadPrefs, savePrefs } from './lib/storage'
import {
  CANVAS_H,
  CANVAS_W,
  MONTH_NAMES,
  THEMES,
  colorsFromMain,
  normalizeHex,
  themeFromColors,
  type ThemeColors,
  type ThemeId,
} from './lib/themes'

function weekdaysInMonth(year: number, month: number): Set<number> {
  const days = new Set<number>()
  const last = new Date(year, month, 0).getDate()
  for (let d = 1; d <= last; d++) {
    const dow = new Date(year, month - 1, d).getDay()
    if (dow !== 0 && dow !== 6) days.add(d)
  }
  return days
}

function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

function App() {
  const prefs = useMemo(() => loadPrefs(), [])
  const now = useMemo(() => new Date(), [])

  const [themeId, setThemeId] = useState<ThemeId>(prefs.themeId)
  const [colors, setColors] = useState<ThemeColors>(prefs.colors)
  const [name, setName] = useState(prefs.name)
  const [shop, setShop] = useState(prefs.shop)
  const [calendarHeight, setCalendarHeight] = useState(prefs.calendarHeight)
  const [darkness, setDarkness] = useState(prefs.darkness)
  const [photoOffset, setPhotoOffset] = useState(prefs.photoOffset)
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [monthTitle, setMonthTitle] = useState<string>(
    () => MONTH_NAMES[now.getMonth()],
  )
  const [workDays, setWorkDays] = useState<Set<number>>(() => new Set())
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [saveImageUrl, setSaveImageUrl] = useState<string | null>(null)
  const insecure = typeof window !== 'undefined' && !window.isSecureContext

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const saveResultRef = useRef<HTMLElement>(null)

  const theme = themeFromColors(colors)
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDow = new Date(year, month - 1, 1).getDay()

  const applyPreset = (id: ThemeId) => {
    const preset = THEMES.find((t) => t.id === id)
    if (!preset) return
    setThemeId(id)
    setColors({
      main: preset.main,
      accent: preset.accent,
      title: preset.title,
      text: preset.text,
    })
  }

  const updateColor = (key: keyof ThemeColors, value: string) => {
    setThemeId('custom')
    setColors((prev) => ({ ...prev, [key]: normalizeHex(value, prev[key]) }))
  }

  const applyOneColor = (value: string) => {
    setThemeId('custom')
    setColors(colorsFromMain(value))
  }

  // Persist prefs (not photo, not work days)
  useEffect(() => {
    savePrefs({
      themeId,
      colors,
      name,
      shop,
      calendarHeight,
      darkness,
      photoOffset,
    })
  }, [themeId, colors, name, shop, calendarHeight, darkness, photoOffset])

  // Reset work days + English month title when year/month changes
  useEffect(() => {
    setWorkDays(new Set())
    setMonthTitle(MONTH_NAMES[month - 1])
  }, [year, month])

  // Draw preview
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawCalendar(ctx, {
      theme,
      year,
      month,
      monthTitle,
      workDays,
      name,
      shop,
      calendarHeight,
      darkness,
      photoOffset,
      photo,
    })
  }, [
    theme,
    year,
    month,
    monthTitle,
    workDays,
    name,
    shop,
    calendarHeight,
    darkness,
    photoOffset,
    photo,
  ])

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl)
    }
  }, [photoUrl])

  const onPickPhoto = useCallback((file: File | undefined) => {
    if (!file) return
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setPhoto(img)
      setPhotoUrl(url)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      setErrorMsg('写真の読み込みに失敗しました')
    }
    img.src = url
  }, [photoUrl])

  const clearPhoto = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhoto(null)
    setPhotoUrl(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const toggleDay = (day: number) => {
    setWorkDays((prev) => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  const goMonth = (delta: number) => {
    const next = shiftMonth(year, month, delta)
    setYear(next.year)
    setMonth(next.month)
  }

  const handleSave = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setSaving(true)
    setErrorMsg(null)
    setStatusMsg(null)
    try {
      const result = await saveCanvasImage(canvas)
      if (result.dataUrl) setSaveImageUrl(result.dataUrl)
      if (result.message) setStatusMsg(result.message)
      if (result.error) setErrorMsg(result.error)
      if (result.method === 'none') {
        setErrorMsg(result.error ?? '保存に失敗しました')
      }
      requestAnimationFrame(() => {
        saveResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const years = useMemo(() => {
    const y = now.getFullYear()
    return [y - 1, y, y + 1, y + 2]
  }, [now])

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-10 pt-5">
      <header className="mb-4 text-center">
        <h1 className="text-[22px] font-semibold tracking-wide text-[#efedf5]">
          出勤カレンダーメーカー
        </h1>
        <p className="mt-1 text-[13px] text-[#9b97a8]">
          Instagram用 4:5 画像を作成
        </p>
      </header>

      <section className="mb-5 flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full max-w-[340px] rounded-lg border border-[#2f2d3a] bg-[#1d1c25] shadow-lg"
          style={{ aspectRatio: '1080 / 1350' }}
        />
      </section>

      <Panel title="年月">
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            className="flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-[#2f2d3a] bg-[#14131a] text-[22px]"
            onClick={() => goMonth(-1)}
            aria-label="前の月"
          >
            ‹
          </button>
          <div className="flex-1 text-center text-[18px] font-medium tracking-wide text-[#efedf5]">
            {year}年 {month}月
          </div>
          <button
            type="button"
            className="flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-[#2f2d3a] bg-[#14131a] text-[22px]"
            onClick={() => goMonth(1)}
            aria-label="次の月"
          >
            ›
          </button>
        </div>
        <div className="flex gap-3">
          <label className="flex min-h-11 flex-1 items-center gap-2">
            <span className="text-[13px] text-[#9b97a8]">年</span>
            <select
              className="min-h-11 flex-1 rounded-lg border border-[#2f2d3a] bg-[#14131a] px-3 text-[#efedf5]"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-h-11 flex-1 items-center gap-2">
            <span className="text-[13px] text-[#9b97a8]">月</span>
            <select
              className="min-h-11 flex-1 rounded-lg border border-[#2f2d3a] bg-[#14131a] px-3 text-[#efedf5]"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}月
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-3 block">
          <span className="mb-1 block text-[13px] text-[#9b97a8]">
            英語の月名（画像上の SEPTEMBER など）
          </span>
          <input
            type="text"
            value={monthTitle}
            onChange={(e) => setMonthTitle(e.target.value.toUpperCase())}
            placeholder="SEPTEMBER"
            className="min-h-11 w-full rounded-lg border border-[#2f2d3a] bg-[#14131a] px-3 tracking-[0.12em] text-[#efedf5] outline-none placeholder:text-[#5c5868]"
          />
        </label>
      </Panel>

      <Panel title="写真">
        <div className="flex gap-2">
          <button
            type="button"
            className="min-h-11 flex-1 rounded-lg border border-[#2f2d3a] bg-[#14131a] px-3 text-[15px]"
            onClick={() => fileRef.current?.click()}
          >
            写真を選択
          </button>
          <button
            type="button"
            className="min-h-11 rounded-lg border border-[#2f2d3a] bg-[#14131a] px-4 text-[15px] disabled:opacity-40"
            onClick={clearPhoto}
            disabled={!photo}
          >
            削除
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickPhoto(e.target.files?.[0])}
          />
        </div>
        <Slider
          label="上下位置"
          value={photoOffset * 100}
          min={0}
          max={100}
          onChange={(v) => setPhotoOffset(v / 100)}
          disabled={!photo}
        />
        <Slider
          label={`暗さ ${Math.round(darkness * 100)}%`}
          value={darkness * 100}
          min={0}
          max={60}
          onChange={(v) => setDarkness(v / 100)}
        />
      </Panel>

      <Panel title="出勤日">
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            className="min-h-11 flex-1 rounded-lg border border-[#2f2d3a] bg-[#14131a] text-[14px]"
            onClick={() => setWorkDays(new Set())}
          >
            全クリア
          </button>
          <button
            type="button"
            className="min-h-11 flex-1 rounded-lg border border-[#2f2d3a] bg-[#14131a] text-[14px]"
            onClick={() => setWorkDays(weekdaysInMonth(year, month))}
          >
            平日だけ
          </button>
        </div>
        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[12px] text-[#9b97a8]">
          {['日', '月', '火', '水', '木', '金', '土'].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) =>
            day == null ? (
              <div key={`e-${i}`} className="aspect-square" />
            ) : (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className="flex aspect-square min-h-11 items-center justify-center rounded-full text-[15px] transition-colors"
                style={
                  workDays.has(day)
                    ? { background: theme.main, color: '#fff' }
                    : { background: '#14131a', color: '#efedf5' }
                }
                aria-pressed={workDays.has(day)}
              >
                {day}
              </button>
            ),
          )}
        </div>
      </Panel>

      <Panel title="テキスト（任意）">
        <label className="mb-3 block">
          <span className="mb-1 block text-[13px] text-[#9b97a8]">名前</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：あい"
            className="min-h-11 w-full rounded-lg border border-[#2f2d3a] bg-[#14131a] px-3 text-[#efedf5] outline-none placeholder:text-[#5c5868]"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[13px] text-[#9b97a8]">店名</span>
          <input
            type="text"
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            placeholder="例：Club Moon"
            className="min-h-11 w-full rounded-lg border border-[#2f2d3a] bg-[#14131a] px-3 text-[#efedf5] outline-none placeholder:text-[#5c5868]"
          />
        </label>
      </Panel>

      <Panel title="全体の色">
        <p className="mb-3 text-[12px] text-[#9b97a8]">プリセット、または下で好きな色に変更</p>
        <div className="mb-4 flex flex-wrap justify-center gap-3 py-1">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              title={t.label}
              aria-label={t.label}
              aria-pressed={themeId === t.id}
              onClick={() => applyPreset(t.id)}
              className="h-12 w-12 rounded-full border-2 transition-transform active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${t.main}, ${t.accent})`,
                borderColor: themeId === t.id ? '#efedf5' : '#2f2d3a',
                boxShadow: themeId === t.id ? `0 0 0 3px ${t.main}55` : undefined,
              }}
            />
          ))}
        </div>

        <label className="mb-4 flex min-h-11 items-center gap-3 rounded-lg border border-[#2f2d3a] bg-[#14131a] px-3 py-2">
          <span className="w-24 shrink-0 text-[13px] text-[#9b97a8]">1色で決める</span>
          <input
            type="color"
            value={colors.main}
            onChange={(e) => applyOneColor(e.target.value)}
            className="h-11 w-14 cursor-pointer rounded-md border border-[#2f2d3a] bg-transparent p-1"
          />
          <span className="text-[12px] text-[#cfcadb]">メイン色から全体を自動調整</span>
        </label>

        <ColorRow
          label="メイン色"
          hint="出勤丸・平日"
          value={colors.main}
          onChange={(v) => updateColor('main', v)}
        />
        <ColorRow
          label="アクセント"
          hint="土日"
          value={colors.accent}
          onChange={(v) => updateColor('accent', v)}
        />
        <ColorRow
          label="数字の色"
          hint="大きな月"
          value={colors.title}
          onChange={(v) => updateColor('title', v)}
        />
        <ColorRow
          label="文字色"
          hint="月名・日付など"
          value={colors.text}
          onChange={(v) => updateColor('text', v)}
        />
      </Panel>

      <Panel title="カレンダーの高さ">
        <Slider
          label="顔にかぶらないよう調整"
          value={calendarHeight * 100}
          min={28}
          max={62}
          onChange={(v) => setCalendarHeight(v / 100)}
        />
      </Panel>

      {insecure && (
        <p className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-100">
          いまはHTTP接続です。共有シートは使えません。保存ボタン後に出る画像を長押し →「写真に追加」で保存してください（本番のHTTPSでは共有シートが使えます）。
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-2 flex min-h-12 w-full items-center justify-center rounded-xl text-[17px] font-semibold text-white shadow-lg disabled:opacity-60"
        style={{
          background: `linear-gradient(135deg, ${theme.main}, ${theme.accent})`,
        }}
      >
        {saving ? '保存中…' : '画像を保存'}
      </button>

      {statusMsg && (
        <p className="mt-3 text-center text-[14px] text-[#cfcadb]">{statusMsg}</p>
      )}
      {errorMsg && (
        <p className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-100">
          {errorMsg}
        </p>
      )}

      {saveImageUrl && (
        <section
          ref={saveResultRef}
          className="mt-5 rounded-xl border-2 border-[#efedf5]/30 bg-[#1d1c25] p-4"
        >
          <p className="mb-1 text-center text-[16px] font-semibold text-[#efedf5]">
            この画像を長押し
          </p>
          <p className="mb-3 text-center text-[13px] text-[#cfcadb]">
            メニューから「写真に追加」を選ぶとカメラロールに保存されます
          </p>
          <img
            src={saveImageUrl}
            alt="生成した出勤カレンダー（長押しで保存）"
            className="saveable mx-auto block w-full max-w-[340px] rounded-lg"
          />
          <a
            href={saveImageUrl}
            download="calendar.jpg"
            className="mt-3 flex min-h-11 items-center justify-center rounded-lg border border-[#2f2d3a] bg-[#14131a] text-[14px]"
          >
            ダウンロード（PC向け）
          </a>
        </section>
      )}
    </div>
  )
}

function ColorRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint: string
  value: string
  onChange: (v: string) => void
}) {
  const [text, setText] = useState(value)
  useEffect(() => {
    setText(value)
  }, [value])

  return (
    <div className="mb-2 flex min-h-11 items-center gap-2">
      <div className="w-24 shrink-0">
        <div className="text-[13px] text-[#cfcadb]">{label}</div>
        <div className="text-[11px] text-[#9b97a8]">{hint}</div>
      </div>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-14 shrink-0 cursor-pointer rounded-md border border-[#2f2d3a] bg-[#14131a] p-1"
        aria-label={label}
      />
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onChange(normalizeHex(text, value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onChange(normalizeHex(text, value))
            ;(e.target as HTMLInputElement).blur()
          }
        }}
        className="min-h-11 min-w-0 flex-1 rounded-lg border border-[#2f2d3a] bg-[#14131a] px-3 font-mono text-[13px] uppercase text-[#efedf5] outline-none"
        spellCheck={false}
        inputMode="text"
        autoCapitalize="characters"
      />
    </div>
  )
}

function Panel({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="mb-4 rounded-xl border border-[#2f2d3a] bg-[#1d1c25] p-4">
      <h2 className="mb-3 text-[14px] font-medium tracking-wide text-[#cfcadb]">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
  disabled,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  return (
    <label className={`mt-2 block ${disabled ? 'opacity-40' : ''}`}>
      <span className="mb-0 block text-[13px] text-[#9b97a8]">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

export default App
