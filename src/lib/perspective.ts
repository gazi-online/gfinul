export type Point = { x: number; y: number };

/**
 * Solves a system of linear equations using Gaussian elimination.
 * AX = B
 */
function solve(A: number[][], B: number[]): number[] {
  const n = B.length;
  for (let i = 0; i < n; i++) {
    // Search for maximum in this column
    let maxEl = Math.abs(A[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > maxEl) {
        maxEl = Math.abs(A[k][i]);
        maxRow = k;
      }
    }

    // Swap maximum row with current row (column by column)
    for (let k = i; k < n; k++) {
      const tmp = A[maxRow][k];
      A[maxRow][k] = A[i][k];
      A[i][k] = tmp;
    }
    const tmp = B[maxRow];
    B[maxRow] = B[i];
    B[i] = tmp;

    // Make all rows below this one 0 in current column
    for (let k = i + 1; k < n; k++) {
      const c = -A[k][i] / A[i][i];
      for (let j = i; j < n; j++) {
        if (i === j) {
          A[k][j] = 0;
        } else {
          A[k][j] += c * A[i][j];
        }
      }
      B[k] += c * B[i];
    }
  }

  // Solve equation Ax=b for an upper triangular matrix A
  const x = new Array(n).fill(0);
  for (let i = n - 1; i > -1; i--) {
    x[i] = B[i] / A[i][i];
    for (let k = i - 1; k > -1; k--) {
      B[k] -= A[k][i] * x[i];
    }
  }
  return x;
}

/**
 * Computes the 3x3 homography matrix mapping src points to dst points.
 * Points should be [TL, TR, BR, BL]
 */
export function getHomography(src: Point[], dst: Point[]): number[] {
  const A: number[][] = [];
  const B: number[] = [];

  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i];
    const { x: u, y: v } = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    B.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    B.push(v);
  }

  const h = solve(A, B);
  return [...h, 1]; // h33 = 1
}

/**
 * Converts a 3x3 homography matrix to a 4x4 CSS matrix3d string.
 */
export function toMatrix3d(h: number[]): string {
  // CSS matrix3d is column-major
  const m = [
    h[0], h[3], 0, h[6],
    h[1], h[4], 0, h[7],
    0,    0,    1, 0,
    h[2], h[5], 0, h[8]
  ];
  return `matrix3d(${m.join(',')})`;
}

/**
 * Applies perspective warp to a canvas.
 * This is a pixel-by-pixel operation and can be intensive for very large images.
 */
export function warpPerspective(
  source: HTMLImageElement | HTMLCanvasElement,
  srcPoints: Point[],
  width: number,
  height: number,
  contrast: number = 100
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  // Target points are the corners of the new canvas
  const dstPoints: Point[] = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height }
  ];

  // We need the inverse homography to map target pixels back to source pixels
  const h = getHomography(dstPoints, srcPoints);

  // Draw source to a temp canvas to get pixel data
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  srcCanvas.height = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  const sCtx = srcCanvas.getContext('2d')!;
  sCtx.filter = `contrast(${contrast}%)`;
  sCtx.drawImage(source, 0, 0);
  const srcData = sCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
  const dstData = ctx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const z = h[6] * x + h[7] * y + h[8];
      const sx = (h[0] * x + h[1] * y + h[2]) / z;
      const sy = (h[3] * x + h[4] * y + h[5]) / z;

      if (sx >= 0 && sx < srcCanvas.width - 1 && sy >= 0 && sy < srcCanvas.height - 1) {
        // Bilinear interpolation
        const x0 = Math.floor(sx);
        const y0 = Math.floor(sy);
        const x1 = x0 + 1;
        const y1 = y0 + 1;
        const dx = sx - x0;
        const dy = sy - y0;

        const idx = (y * width + x) * 4;
        for (let c = 0; c < 4; c++) {
          const sIdx00 = (y0 * srcCanvas.width + x0) * 4 + c;
          const sIdx10 = (y0 * srcCanvas.width + x1) * 4 + c;
          const sIdx01 = (y1 * srcCanvas.width + x0) * 4 + c;
          const sIdx11 = (y1 * srcCanvas.width + x1) * 4 + c;

          const val = 
            srcData.data[sIdx00] * (1 - dx) * (1 - dy) +
            srcData.data[sIdx10] * dx * (1 - dy) +
            srcData.data[sIdx01] * (1 - dx) * dy +
            srcData.data[sIdx11] * dx * dy;
          
          dstData.data[idx + c] = val;
        }
      }
    }
  }

  ctx.putImageData(dstData, 0, 0);
  return canvas;
}
