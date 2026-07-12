import { describe, it, expect, vi } from "vitest";
import { registerPinImages } from "./register-pin-images";
import { ALL_POI_KEYS } from "./poi-categories";

// Reuse the pin-images stub-doc pattern so createFlagImage/createLollipopImage
// don't hit jsdom's missing canvas implementation.
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
  return { doc };
}

describe("registerPinImages", () => {
  it("registers the flag icon plus one lollipop per POI category (7 total)", () => {
    const { doc } = makeStubDoc();
    const map = { hasImage: vi.fn(() => false), addImage: vi.fn() };

    registerPinImages(map, doc);

    // flag + 6 categories = 7 addImage calls
    expect(map.addImage).toHaveBeenCalledTimes(ALL_POI_KEYS.length + 1);
    expect(map.addImage).toHaveBeenCalledWith(
      "td-flag",
      expect.anything(),
      { pixelRatio: 2 },
    );
    for (const key of ALL_POI_KEYS) {
      expect(map.addImage).toHaveBeenCalledWith(
        `poi-pin-${key}`,
        expect.anything(),
        { pixelRatio: 2 },
      );
    }
  });

  it("is idempotent — skips addImage when hasImage returns true", () => {
    const { doc } = makeStubDoc();
    const map = { hasImage: vi.fn(() => true), addImage: vi.fn() };

    registerPinImages(map, doc);

    expect(map.addImage).not.toHaveBeenCalled();
  });
});
