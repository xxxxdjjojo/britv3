import { describe, it, expect } from "vitest";
import { validateFile, ALLOWED_TYPES, MAX_FILE_SIZE } from "./file-validator";

// Magic bytes for common file types
const JPEG_HEADER = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PDF_HEADER = Buffer.from("%PDF-1.4");
const WEBP_HEADER = Buffer.from([
  0x52, 0x49, 0x46, 0x46, // RIFF
  0x00, 0x00, 0x00, 0x00, // file size (placeholder)
  0x57, 0x45, 0x42, 0x50, // WEBP
]);

function makeBuffer(header: Buffer, size: number): Buffer {
  const buf = Buffer.alloc(size);
  header.copy(buf);
  return buf;
}

describe("file-validator", () => {
  describe("ALLOWED_TYPES", () => {
    it("includes PDF, JPEG, PNG, and WebP", () => {
      expect(ALLOWED_TYPES.has("application/pdf")).toBe(true);
      expect(ALLOWED_TYPES.has("image/jpeg")).toBe(true);
      expect(ALLOWED_TYPES.has("image/png")).toBe(true);
      expect(ALLOWED_TYPES.has("image/webp")).toBe(true);
    });
  });

  describe("MAX_FILE_SIZE", () => {
    it("is 10MB", () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    });
  });

  describe("validateFile", () => {
    it("accepts a valid JPEG file", async () => {
      const buf = makeBuffer(JPEG_HEADER, 1024);
      const result = await validateFile(buf);
      expect(result.mime).toBe("image/jpeg");
      expect(result.ext).toBe("jpg");
    });

    it("accepts a valid PNG file", async () => {
      const buf = makeBuffer(PNG_HEADER, 1024);
      const result = await validateFile(buf);
      expect(result.mime).toBe("image/png");
      expect(result.ext).toBe("png");
    });

    it("accepts a valid PDF file", async () => {
      const buf = makeBuffer(PDF_HEADER, 1024);
      const result = await validateFile(buf);
      expect(result.mime).toBe("application/pdf");
      expect(result.ext).toBe("pdf");
    });

    it("accepts a valid WebP file", async () => {
      const buf = makeBuffer(WEBP_HEADER, 1024);
      const result = await validateFile(buf);
      expect(result.mime).toBe("image/webp");
      expect(result.ext).toBe("webp");
    });

    it("rejects a file with unrecognized magic bytes", async () => {
      const buf = Buffer.alloc(1024, 0x00);
      await expect(validateFile(buf)).rejects.toThrow();
    });

    it("rejects a file exceeding MAX_FILE_SIZE", async () => {
      const buf = makeBuffer(JPEG_HEADER, MAX_FILE_SIZE + 1);
      await expect(validateFile(buf)).rejects.toThrow(/size/i);
    });

    it("rejects a GIF file (not in allowed types)", async () => {
      // GIF89a magic bytes
      const gifHeader = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
      const buf = makeBuffer(gifHeader, 1024);
      await expect(validateFile(buf)).rejects.toThrow(/not allowed/i);
    });
  });
});
