import { describe, it, expect } from "vitest";
import { detectMimeType } from "../file-magic";

describe("detectMimeType", () => {
  it("detects PDF from magic bytes", () => {
    const buffer = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]).buffer;
    expect(detectMimeType(buffer)).toBe("application/pdf");
  });

  it("detects JPEG from magic bytes", () => {
    const buffer = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer;
    expect(detectMimeType(buffer)).toBe("image/jpeg");
  });

  it("detects PNG from magic bytes", () => {
    const buffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer;
    expect(detectMimeType(buffer)).toBe("image/png");
  });

  it("detects WebP from magic bytes", () => {
    const buffer = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50,
    ]).buffer;
    expect(detectMimeType(buffer)).toBe("image/webp");
  });

  it("returns null for EXE disguised as PDF", () => {
    // MZ header (DOS executable)
    const buffer = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]).buffer;
    expect(detectMimeType(buffer)).toBeNull();
  });

  it("returns null for empty buffer", () => {
    expect(detectMimeType(new ArrayBuffer(0))).toBeNull();
  });
});
