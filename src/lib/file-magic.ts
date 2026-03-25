const SIGNATURES: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
];

const WEBP_MARKER = [0x57, 0x45, 0x42, 0x50];

export function detectMimeType(buffer: ArrayBuffer): string | null {
  const view = new Uint8Array(buffer);
  if (view.length < 4) return null;

  for (const sig of SIGNATURES) {
    const offset = sig.offset ?? 0;
    if (view.length < offset + sig.bytes.length) continue;
    const match = sig.bytes.every((b, i) => view[offset + i] === b);
    if (!match) continue;

    // WebP needs secondary check at offset 8
    if (sig.mime === "image/webp") {
      if (view.length < 12) continue;
      const webpMatch = WEBP_MARKER.every((b, i) => view[8 + i] === b);
      if (!webpMatch) continue;
    }

    return sig.mime;
  }

  // ZIP-based formats (DOCX)
  if (view[0] === 0x50 && view[1] === 0x4b && view[2] === 0x03 && view[3] === 0x04) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  // OLE2 (DOC)
  if (view[0] === 0xd0 && view[1] === 0xcf && view[2] === 0x11 && view[3] === 0xe0) {
    return "application/msword";
  }

  return null;
}
