export type SaveResult = {
  method: 'share' | 'image' | 'download' | 'none'
  message?: string
  dataUrl?: string
  error?: string
}

function isShareCancel(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

/** Sync dataURL → File（toBlob の非同期でユーザー操作が切れるのを避ける） */
function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(',')
  const mime = /data:(.*?);/.exec(header)?.[1] ?? 'image/jpeg'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new File([bytes], filename, { type: mime })
}

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/**
 * ① Web Share（HTTPS + ユーザー操作が必須）
 * ② 常に <img> 用 dataURL を返す（長押しで写真に追加）
 * ③ PC のみ <a download>
 */
export async function saveCanvasImage(
  canvas: HTMLCanvasElement,
): Promise<SaveResult> {
  const errors: string[] = []
  const filename = 'calendar.jpg'

  // JPEG: iOS「写真に追加」と互換性が高く、PNGより軽い
  let dataUrl: string
  try {
    dataUrl = canvas.toDataURL('image/jpeg', 0.92)
  } catch (err) {
    return {
      method: 'none',
      error: `画像生成失敗: ${err instanceof Error ? err.message : String(err)}`,
    }
  }

  // ① Web Share — HTTPS 以外では動かない
  if (!window.isSecureContext) {
    errors.push(
      '共有APIはHTTPSでのみ使えます（いまはHTTP）。下の画像を長押しして「写真に追加」してください',
    )
  } else if (typeof navigator.share === 'function') {
    try {
      const file = dataUrlToFile(dataUrl, filename)
      const payload = { files: [file] as File[] }
      const can =
        typeof navigator.canShare !== 'function' || navigator.canShare(payload)
      if (can) {
        await navigator.share(payload)
        return {
          method: 'share',
          dataUrl,
          message:
            '共有シートから「画像を保存」または「写真に追加」を選んでください',
        }
      }
      errors.push('この端末では画像ファイルの共有に対応していません')
    } catch (err) {
      if (isShareCancel(err)) {
        return {
          method: 'share',
          dataUrl,
          message:
            '共有をキャンセルしました。下の画像を長押ししても保存できます',
        }
      }
      errors.push(`共有: ${err instanceof Error ? err.message : String(err)}`)
    }
  } else {
    errors.push('このブラウザはWeb Share API非対応です')
  }

  // ③ PC向けダウンロード（iOSでは自動DLすると長押しを邪魔することがあるのでスキップ）
  if (!isIos()) {
    try {
      triggerDownload(dataUrl, filename)
      return {
        method: 'download',
        dataUrl,
        message: 'ダウンロードを開始しました。下の画像も長押しで保存できます',
        error: errors.length ? errors.join(' / ') : undefined,
      }
    } catch (err) {
      errors.push(
        `ダウンロード: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  // ② 必ず dataURL を返して <img> 長押し保存へ
  return {
    method: 'image',
    dataUrl,
    message: '下の画像を長押し →「写真に追加」を選んでください',
    error: errors.length ? errors.join(' / ') : undefined,
  }
}
