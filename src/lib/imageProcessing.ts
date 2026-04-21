/** Load a dataURL or objectURL into an HTMLImageElement */
function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = rej
    img.src = src
  })
}

/** Sample average colour from a small corner region */
function sampleCornerColor(
  data: Uint8ClampedArray,
  W: number,
  H: number,
  corner: 'tl' | 'tr' | 'bl' | 'br',
  size = 12
): [number, number, number] {
  let r = 0, g = 0, b = 0, n = 0
  const startX = corner === 'tl' || corner === 'bl' ? 0 : W - size
  const startY = corner === 'tl' || corner === 'tr' ? 0 : H - size
  for (let y = startY; y < startY + size && y < H; y++) {
    for (let x = startX; x < startX + size && x < W; x++) {
      const i = (y * W + x) * 4
      r += data[i]; g += data[i + 1]; b += data[i + 2]; n++
    }
  }
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)]
}

/** Returns true if a pixel is "close enough" to the background color */
function isBgPixel(
  r: number, g: number, b: number,
  bgR: number, bgG: number, bgB: number,
  tol: number
): boolean {
  return Math.abs(r - bgR) <= tol && Math.abs(g - bgG) <= tol && Math.abs(b - bgB) <= tol
}

/**
 * Auto Smart Crop — auto-detects and trims the background border around an ID card.
 * Samples the 4 corners to determine background colour, then finds the
 * bounding box of content that differs from that background.
 * Returns a JPEG data-URL of the cropped image.
 */
export async function smartCrop(src: string): Promise<string> {
  const img = await loadImg(src)
  const W = img.naturalWidth, H = img.naturalHeight

  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const { data } = ctx.getImageData(0, 0, W, H)
  const px = (x: number, y: number): [number, number, number] => {
    const i = (y * W + x) * 4
    return [data[i], data[i + 1], data[i + 2]]
  }

  // Average the 4 corner samples to get the background colour
  const corners = ['tl', 'tr', 'bl', 'br'].map(c =>
    sampleCornerColor(data, W, H, c as any)
  ) as [number, number, number][]
  const bgR = Math.round(corners.reduce((s, c) => s + c[0], 0) / 4)
  const bgG = Math.round(corners.reduce((s, c) => s + c[1], 0) / 4)
  const bgB = Math.round(corners.reduce((s, c) => s + c[2], 0) / 4)
  const tol = 42 // slightly increased tolerance

  // Robust Scan: instead of first pixel, look for a cluster or a row with multiple non-bg pixels
  const isNonBg = (x: number, y: number) => !isBgPixel(...px(x, y), bgR, bgG, bgB, tol)

  let top = 0
  scan_top: for (let y = 0; y < H; y++) {
    let count = 0
    for (let x = 0; x < W; x++) if (isNonBg(x, y)) count++
    if (count > W * 0.02) { top = y; break scan_top } // Need 2% of width to be non-bg
  }

  let bottom = H - 1
  scan_bottom: for (let y = H - 1; y > top; y--) {
    let count = 0
    for (let x = 0; x < W; x++) if (isNonBg(x, y)) count++
    if (count > W * 0.02) { bottom = y; break scan_bottom }
  }

  let left = 0
  scan_left: for (let x = 0; x < W; x++) {
    let count = 0
    for (let y = top; y <= bottom; y++) if (isNonBg(x, y)) count++
    if (count > (bottom - top) * 0.02) { left = x; break scan_left }
  }

  let right = W - 1
  scan_right: for (let x = W - 1; x > left; x--) {
    let count = 0
    for (let y = top; y <= bottom; y++) if (isNonBg(x, y)) count++
    if (count > (bottom - top) * 0.02) { right = x; break scan_right }
  }

  const pad = 12
  top    = Math.max(0, top - pad)
  bottom = Math.min(H - 1, bottom + pad)
  left   = Math.max(0, left - pad)
  right  = Math.min(W - 1, right + pad)

  const cropW = right - left
  const cropH = bottom - top

  if (cropW < 50 || cropH < 50) return src

  const out = document.createElement('canvas')
  out.width = cropW; out.height = cropH
  out.getContext('2d')!.drawImage(c, left, top, cropW, cropH, 0, 0, cropW, cropH)
  return out.toDataURL('image/jpeg', 0.95)
}

/**
 * Magic Filter — auto-contrast + sharpen + adaptive whitening for a crisp scan look.
 * Returns a JPEG data-URL.
 */
export async function magicFilter(src: string): Promise<string> {
  const img = await loadImg(src)
  const W = img.naturalWidth, H = img.naturalHeight

  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')!

  // Initial pass: contrast + brightness + slight saturation boost
  ctx.filter = 'contrast(145%) brightness(108%) saturate(105%)'
  ctx.drawImage(img, 0, 0)
  ctx.filter = 'none'

  const imageData = ctx.getImageData(0, 0, W, H)
  const d = imageData.data
  const out = new Uint8ClampedArray(d.length)

  // 1. Adaptive Whitening: Boost pixels that are likely background
  // This helps clean up greyish/yellowish scans into pure white
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2]
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    
    if (brightness > 170) {
      const factor = (brightness - 170) / (255 - 170)
      d[i] = Math.min(255, r + (255 - r) * factor * 0.8)
      d[i + 1] = Math.min(255, g + (255 - g) * factor * 0.8)
      d[i + 2] = Math.min(255, b + (255 - b) * factor * 0.8)
    }
  }

  // 2. Unsharp-mask (3×3 sharpen kernel)
  const kernel = [
    0, -0.8, 0,
    -0.8, 4.2, -0.8,
    0, -0.8, 0
  ]

  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const base = (y * W + x) * 4
      for (let ch = 0; ch < 3; ch++) {
        let v = 0
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            v += d[((y + ky) * W + (x + kx)) * 4 + ch] * kernel[(ky + 1) * 3 + (kx + 1)]
          }
        }
        out[base + ch] = Math.min(255, Math.max(0, v))
      }
      out[base + 3] = 255
    }
  }

  // Copy edge pixels
  for (let x = 0; x < W; x++) {
    for (const y of [0, H - 1]) {
      const i = (y * W + x) * 4
      out[i] = d[i]; out[i+1] = d[i+1]; out[i+2] = d[i+2]; out[i+3] = d[i+3]
    }
  }
  for (let y = 0; y < H; y++) {
    for (const x of [0, W - 1]) {
      const i = (y * W + x) * 4
      out[i] = d[i]; out[i+1] = d[i+1]; out[i+2] = d[i+2]; out[i+3] = d[i+3]
    }
  }

  ctx.putImageData(new ImageData(out, W, H), 0, 0)
  return c.toDataURL('image/jpeg', 0.95)
}
