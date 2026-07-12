import { describe, it, expect, vi } from "vitest";
import { PIN_PIXEL_RATIO, createFlagImage, createLollipopImage } from "./pin-images";

// ---------------------------------------------------------------------------
// Stub factory
// ---------------------------------------------------------------------------

function makeStubDoc() {
  const ctx = {
    scale: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    roundRect: vi.fn(),
    rect: vi.fn(),
    quadraticCurveTo: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 0, height: 0 })),
    set fillStyle(_v: string) {},
    set strokeStyle(_v: string) {},
    set lineWidth(_v: number) {},
    set font(_v: string) {},
    set textAlign(_v: string) {},
    set textBaseline(_v: string) {},
  };
  const canvas = { width: 0, height: 0, getContext: vi.fn(() => ctx) };
  const doc = { createElement: vi.fn(() => canvas) } as unknown as Document;
  return { doc, ctx, canvas };
}

// ---------------------------------------------------------------------------
// Constant
// ---------------------------------------------------------------------------

describe("PIN_PIXEL_RATIO", () => {
  it("equals 2", () => {
    expect(PIN_PIXEL_RATIO).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// createFlagImage
// ---------------------------------------------------------------------------

describe("createFlagImage", () => {
  it("returns bitmap dimensions 120×128 (2× logical 60×64)", () => {
    const { doc } = makeStubDoc();
    const result = createFlagImage(doc);
    expect(result.width).toBe(120);
    expect(result.height).toBe(128);
  });

  it("sets canvas bitmap size to 120×128 before drawing", () => {
    const { doc, canvas } = makeStubDoc();
    createFlagImage(doc);
    expect(canvas.width).toBe(120);
    expect(canvas.height).toBe(128);
  });

  it("calls ctx.scale(2, 2) for retina drawing", () => {
    const { doc, ctx } = makeStubDoc();
    createFlagImage(doc);
    expect(ctx.scale).toHaveBeenCalledWith(2, 2);
  });

  it("calls getImageData with full bitmap dimensions", () => {
    const { doc, ctx } = makeStubDoc();
    createFlagImage(doc);
    expect(ctx.getImageData).toHaveBeenCalledWith(0, 0, 120, 128);
  });

  it("draws a pole via fillRect", () => {
    const { doc, ctx } = makeStubDoc();
    createFlagImage(doc);
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it("draws the plaque (uses beginPath and fill)", () => {
    const { doc, ctx } = makeStubDoc();
    createFlagImage(doc);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
  });

  it("draws the 'T' label via fillText", () => {
    const { doc, ctx } = makeStubDoc();
    createFlagImage(doc);
    expect(ctx.fillText).toHaveBeenCalledWith("T", expect.any(Number), expect.any(Number));
  });

  it("returns the imageData from getImageData", () => {
    const { doc, ctx } = makeStubDoc();
    const stubImageData = { data: new Uint8ClampedArray(4), width: 0, height: 0 };
    ctx.getImageData.mockReturnValue(stubImageData);
    const result = createFlagImage(doc);
    expect(result.imageData).toBe(stubImageData);
  });
});

// ---------------------------------------------------------------------------
// createLollipopImage
// ---------------------------------------------------------------------------

describe("createLollipopImage", () => {
  it("returns bitmap dimensions 52×104 (2× logical 26×52)", () => {
    const { doc } = makeStubDoc();
    const result = createLollipopImage("#e84d8a", doc);
    expect(result.width).toBe(52);
    expect(result.height).toBe(104);
  });

  it("sets canvas bitmap size to 52×104 before drawing", () => {
    const { doc, canvas } = makeStubDoc();
    createLollipopImage("#e84d8a", doc);
    expect(canvas.width).toBe(52);
    expect(canvas.height).toBe(104);
  });

  it("calls ctx.scale(2, 2) for retina drawing", () => {
    const { doc, ctx } = makeStubDoc();
    createLollipopImage("#e84d8a", doc);
    expect(ctx.scale).toHaveBeenCalledWith(2, 2);
  });

  it("calls getImageData with full bitmap dimensions", () => {
    const { doc, ctx } = makeStubDoc();
    createLollipopImage("#e84d8a", doc);
    expect(ctx.getImageData).toHaveBeenCalledWith(0, 0, 52, 104);
  });

  it("draws the head circle via arc", () => {
    const { doc, ctx } = makeStubDoc();
    createLollipopImage("#e84d8a", doc);
    expect(ctx.arc).toHaveBeenCalled();
    // head centre should be at logical (13, 12) — sanity check first arc call
    const [x, y, r] = ctx.arc.mock.calls[0] as [number, number, number, ...unknown[]];
    expect(x).toBe(13);
    expect(y).toBe(12);
    expect(r).toBe(10);
  });

  it("strokes the white ring around the head", () => {
    const { doc, ctx } = makeStubDoc();
    createLollipopImage("#e84d8a", doc);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("draws the pole via fillRect", () => {
    const { doc, ctx } = makeStubDoc();
    createLollipopImage("#e84d8a", doc);
    expect(ctx.fillRect).toHaveBeenCalled();
    // pole: x=12, width=2 (centred on logical 13), top=20, height=32
    const poleCalls = ctx.fillRect.mock.calls as [number, number, number, number][];
    expect(poleCalls.some(([x, , w]) => x === 12 && w === 2)).toBe(true);
  });

  it("does NOT call fillText (no glyph inside head)", () => {
    const { doc, ctx } = makeStubDoc();
    createLollipopImage("#e84d8a", doc);
    expect(ctx.fillText).not.toHaveBeenCalled();
  });

  it("returns the imageData from getImageData", () => {
    const { doc, ctx } = makeStubDoc();
    const stubImageData = { data: new Uint8ClampedArray(4), width: 0, height: 0 };
    ctx.getImageData.mockReturnValue(stubImageData);
    const result = createLollipopImage("#e84d8a", doc);
    expect(result.imageData).toBe(stubImageData);
  });

  it("accepts any CSS colour string for the head fill", () => {
    const { doc: doc1 } = makeStubDoc();
    const { doc: doc2 } = makeStubDoc();
    // Should not throw for any colour value
    expect(() => createLollipopImage("#C26B84", doc1)).not.toThrow();
    expect(() => createLollipopImage("rgb(200,100,50)", doc2)).not.toThrow();
  });
});
