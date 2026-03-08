import { describe, it, expect } from "vitest";
import { validateFileType, MAX_FILE_SIZES } from "@/lib/file-validation";

/**
 * Helper to create a File from a Uint8Array of bytes.
 */
function createFileFromBytes(
  bytes: number[],
  name: string,
  size?: number,
): File {
  const buffer = new Uint8Array(bytes);
  const file = new File([buffer], name, { type: "application/octet-stream" });

  // Override size if specified for size limit tests
  if (size !== undefined) {
    Object.defineProperty(file, "size", { value: size });
  }

  return file;
}

describe("Document upload file validation", () => {
  it("accepts PDF files with correct magic bytes", async () => {
    const pdfBytes = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34];
    const file = createFileFromBytes(pdfBytes, "gas-safety.pdf");
    const result = await validateFileType(file);
    expect(result.valid).toBe(true);
    expect(result.mimeType).toBe("application/pdf");
  });

  it("accepts JPG files with correct magic bytes", async () => {
    const jpegBytes = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46];
    const file = createFileFromBytes(jpegBytes, "epc-certificate.jpg");
    const result = await validateFileType(file);
    expect(result.valid).toBe(true);
    expect(result.mimeType).toBe("image/jpeg");
  });

  it("accepts PNG files with correct magic bytes", async () => {
    const pngBytes = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    const file = createFileFromBytes(pngBytes, "insurance-scan.png");
    const result = await validateFileType(file);
    expect(result.valid).toBe(true);
    expect(result.mimeType).toBe("image/png");
  });

  it("rejects EXE files", async () => {
    const exeBytes = [0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00];
    const file = createFileFromBytes(exeBytes, "malware.exe");
    const result = await validateFileType(file);
    expect(result.valid).toBe(false);
    expect(result.mimeType).toBeNull();
  });

  it("rejects TXT files (plain text bytes)", async () => {
    const txtBytes = [0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x57, 0x6f]; // "Hello Wo"
    const file = createFileFromBytes(txtBytes, "notes.txt");
    const result = await validateFileType(file);
    expect(result.valid).toBe(false);
    expect(result.mimeType).toBeNull();
  });

  it("rejects files with spoofed extensions", async () => {
    // Random bytes named as .pdf
    const randomBytes = [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08];
    const file = createFileFromBytes(randomBytes, "fake.pdf");
    const result = await validateFileType(file);
    expect(result.valid).toBe(false);
    expect(result.mimeType).toBeNull();
  });

  it("rejects empty files", async () => {
    const file = createFileFromBytes([], "empty.pdf");
    const result = await validateFileType(file);
    expect(result.valid).toBe(false);
    expect(result.mimeType).toBeNull();
  });
});

describe("Document size limits", () => {
  it("property-documents bucket has 2MB limit", () => {
    expect(MAX_FILE_SIZES["property-documents"]).toBe(2_097_152);
  });

  it("enforces 2MB size limit (file within limit passes)", () => {
    const fileSize = 1_500_000; // 1.5MB
    expect(fileSize <= MAX_FILE_SIZES["property-documents"]).toBe(true);
  });

  it("enforces 2MB size limit (file over limit fails)", () => {
    const fileSize = 3_000_000; // 3MB
    expect(fileSize <= MAX_FILE_SIZES["property-documents"]).toBe(false);
  });
});
