/**
 * Pure canvas drawing functions that produce MapLibre-ready ImageData for
 * the flag pin (nearby-listing price flags) and POI lollipop pins.
 *
 * Both functions draw at 2× logical size (retina) using the pattern:
 *   canvas = logicalW*2 × logicalH*2
 *   ctx.scale(2, 2)
 *   draw in LOGICAL coordinates
 *   return ctx.getImageData(0, 0, logicalW*2, logicalH*2)
 */

export const PIN_PIXEL_RATIO = 2;

export type PinImage = Readonly<{
  imageData: ImageData;
  /** Bitmap (2×) pixel width — matches imageData.width. */
  width: number;
  /** Bitmap (2×) pixel height — matches imageData.height. */
  height: number;
}>;

// ── Shared helpers ────────────────────────────────────────────────────────────

function resolveDoc(doc?: Document): Document {
  return doc ?? document;
}

function getContext2d(
  canvas: HTMLCanvasElement,
): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    throw new Error("pin-images: failed to obtain 2D canvas context");
  }
  return ctx as CanvasRenderingContext2D;
}

/**
 * Draw a rounded rectangle path using quadraticCurveTo (works everywhere,
 * no need for ctx.roundRect which is absent in some environments).
 */
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Flag pin — logical 60×64 ──────────────────────────────────────────────────

const FLAG_LOGICAL_W = 60;
const FLAG_LOGICAL_H = 64;

/**
 * Draw the TrueDeed brand flag pin (`td-flag`).
 *
 * Logical dimensions: 60×64.  Bitmap: 120×128.
 * icon-anchor: "bottom" → the pole base sits on the map point.
 */
export function createFlagImage(doc?: Document): PinImage {
  const d = resolveDoc(doc);
  const canvas = d.createElement("canvas") as HTMLCanvasElement;

  const bitmapW = FLAG_LOGICAL_W * PIN_PIXEL_RATIO;
  const bitmapH = FLAG_LOGICAL_H * PIN_PIXEL_RATIO;
  canvas.width = bitmapW;
  canvas.height = bitmapH;

  const ctx = getContext2d(canvas);
  ctx.scale(PIN_PIXEL_RATIO, PIN_PIXEL_RATIO);

  // ── Pole ─────────────────────────────────────────────────────────────────
  // Centred at logical x=30, so spans 29→31 (width 2).
  // Runs y 8 → 64 (top of plaque down to logical bottom).
  ctx.fillStyle = "#7d8d90";
  ctx.fillRect(29, 8, 2, 56);

  // ── Plaque ───────────────────────────────────────────────────────────────
  // 26×18 rounded rect, top-left at (30, 8), extends right from the pole.
  ctx.fillStyle = "#1B4D3E";
  roundedRect(ctx, 30, 8, 26, 18, 3);
  ctx.fill();

  // ── Label ─────────────────────────────────────────────────────────────────
  // "T" centred within the plaque: centre-x = 30 + 26/2 = 43, centre-y = 8 + 18/2 = 17
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("T", 43, 17);

  const imageData = ctx.getImageData(0, 0, bitmapW, bitmapH) as ImageData;
  return { imageData, width: bitmapW, height: bitmapH };
}

// ── Lollipop pin — logical 26×52 ─────────────────────────────────────────────

const LOLLIPOP_LOGICAL_W = 26;
const LOLLIPOP_LOGICAL_H = 52;

/**
 * Draw a coloured POI lollipop pin (`poi-pin-<key>`).
 *
 * Logical dimensions: 26×52.  Bitmap: 52×104.
 * icon-anchor: "bottom" → the pole base sits on the map point.
 *
 * @param color  CSS colour string for the circular head fill.
 */
export function createLollipopImage(color: string, doc?: Document): PinImage {
  const d = resolveDoc(doc);
  const canvas = d.createElement("canvas") as HTMLCanvasElement;

  const bitmapW = LOLLIPOP_LOGICAL_W * PIN_PIXEL_RATIO;
  const bitmapH = LOLLIPOP_LOGICAL_H * PIN_PIXEL_RATIO;
  canvas.width = bitmapW;
  canvas.height = bitmapH;

  const ctx = getContext2d(canvas);
  ctx.scale(PIN_PIXEL_RATIO, PIN_PIXEL_RATIO);

  // ── Pole ─────────────────────────────────────────────────────────────────
  // Centred at logical x=13, so spans 12→14 (width 2).
  // Runs y 20 → 52 (below the head circle down to logical bottom).
  ctx.fillStyle = "#7d8d90";
  ctx.fillRect(12, 20, 2, 32);

  // ── Head — filled circle ──────────────────────────────────────────────────
  // Centre (13, 12), radius 10.
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(13, 12, 10, 0, Math.PI * 2);
  ctx.fill();

  // ── White ring ────────────────────────────────────────────────────────────
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(13, 12, 10, 0, Math.PI * 2);
  ctx.stroke();

  const imageData = ctx.getImageData(0, 0, bitmapW, bitmapH) as ImageData;
  return { imageData, width: bitmapW, height: bitmapH };
}
