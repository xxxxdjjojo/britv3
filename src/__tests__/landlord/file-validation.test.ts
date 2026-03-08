import { describe, it, expect } from "vitest";
import { validateFileType, MAX_FILE_SIZES } from "@/lib/file-validation";

/**
 * Helper to create a File from a Uint8Array of bytes.
 */
function createFileFromBytes(
  bytes: number[],
  name: string,
  type = "application/octet-stream"
): File {
  const buffer = new Uint8Array(bytes);
  return new File([buffer], name, { type });
}

describe("validateFileType", () => {
  it("returns valid with mimeType application/pdf for PDF magic bytes", async () => {
    // PDF starts with %PDF (0x25 0x50 0x44 0x46)
    const pdfBytes = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34];
    const file = createFileFromBytes(pdfBytes, "document.pdf");
    const result = await validateFileType(file);
    expect(result.valid).toBe(true);
    expect(result.mimeType).toBe("application/pdf");
  });

  it("returns valid with mimeType image/jpeg for JPEG magic bytes", async () => {
    // JPEG starts with 0xFF 0xD8 0xFF
    const jpegBytes = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46];
    const file = createFileFromBytes(jpegBytes, "photo.jpg");
    const result = await validateFileType(file);
    expect(result.valid).toBe(true);
    expect(result.mimeType).toBe("image/jpeg");
  });

  it("returns valid with mimeType image/png for PNG magic bytes", async () => {
    // PNG starts with 0x89 0x50 0x4E 0x47
    const pngBytes = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    const file = createFileFromBytes(pngBytes, "image.png");
    const result = await validateFileType(file);
    expect(result.valid).toBe(true);
    expect(result.mimeType).toBe("image/png");
  });

  it("returns invalid for a .exe file with random bytes", async () => {
    const exeBytes = [0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00];
    const file = createFileFromBytes(exeBytes, "malware.exe");
    const result = await validateFileType(file);
    expect(result.valid).toBe(false);
    expect(result.mimeType).toBeNull();
  });

  it("returns invalid for random bytes", async () => {
    const randomBytes = [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08];
    const file = createFileFromBytes(randomBytes, "unknown.bin");
    const result = await validateFileType(file);
    expect(result.valid).toBe(false);
    expect(result.mimeType).toBeNull();
  });

  it("returns invalid for an empty file", async () => {
    const file = createFileFromBytes([], "empty.pdf");
    const result = await validateFileType(file);
    expect(result.valid).toBe(false);
    expect(result.mimeType).toBeNull();
  });
});

describe("MAX_FILE_SIZES", () => {
  it("defines correct limits for each bucket", () => {
    expect(MAX_FILE_SIZES["maintenance-photos"]).toBe(1048576); // 1MB
    expect(MAX_FILE_SIZES["expense-receipts"]).toBe(2097152); // 2MB
    expect(MAX_FILE_SIZES["property-documents"]).toBe(2097152); // 2MB
  });
});
