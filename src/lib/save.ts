export type SaveResult = {
  method: 'share' | 'image' | 'download' | 'none'
  message?: string
  dataUrl?: string
  error?: string
}

function isShareCancel(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  )
  if (!blob) throw new Error('画像の生成に失敗しました（toBlob）')
  return blob
}

function triggerDownload(dataUrl: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = 'calendar.png'
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** Try Web Share → show <img> → download link. Failures fall through. */
export async function saveCanvasImage(
  canvas: HTMLCanvasElement,
): Promise<SaveResult> {
  const errors: string[] = []

  // ① Web Share API（本命：iOS共有シート → 画像を保存）
  try {
    const blob = await canvasToBlob(canvas)
    const file = new File([blob], 'calendar.png', { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] })
      return {
        method: 'share',
        message: '共有シートから「画像を保存」を選んでください',
      }
    }
  } catch (err) {
    if (isShareCancel(err)) {
      return { method: 'share', message: '共有をキャンセルしました' }
    }
    errors.push(`共有: ${err instanceof Error ? err.message : String(err)}`)
  }

  // ② <img> 表示（長押しで「写真に追加」）
  let dataUrl: string | undefined
  try {
    dataUrl = canvas.toDataURL('image/png')
  } catch (err) {
    errors.push(`画像表示: ${err instanceof Error ? err.message : String(err)}`)
  }

  // ③ ダウンロードリンク（PC向け）
  if (dataUrl) {
    try {
      triggerDownload(dataUrl)
      return {
        method: 'download',
        dataUrl,
        message: '長押しして「写真に追加」、またはダウンロードを利用してください',
        error: errors.length ? errors.join(' / ') : undefined,
      }
    } catch (err) {
      errors.push(
        `ダウンロード: ${err instanceof Error ? err.message : String(err)}`,
      )
      return {
        method: 'image',
        dataUrl,
        message: '長押しして「写真に追加」を選んでください',
        error: errors.length ? errors.join(' / ') : undefined,
      }
    }
  }

  return {
    method: 'none',
    error: errors.join(' / ') || '保存に失敗しました',
  }
}
