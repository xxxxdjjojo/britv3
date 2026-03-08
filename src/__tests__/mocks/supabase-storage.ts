/**
 * Mock for Supabase Storage operations.
 * Provides factory for creating mock storage client with from().upload(), etc.
 */

import { vi } from "vitest";

export function createMockStorageClient() {
  const upload = vi.fn().mockResolvedValue({
    data: { path: "property-images/test-listing/image.webp" },
    error: null,
  });

  const getPublicUrl = vi.fn().mockReturnValue({
    data: {
      publicUrl: "https://storage.supabase.co/property-images/test-listing/image.webp",
    },
  });

  const createSignedUrl = vi.fn().mockResolvedValue({
    data: {
      signedUrl: "https://storage.supabase.co/signed/property-documents/test-listing/doc.pdf?token=abc",
    },
    error: null,
  });

  const remove = vi.fn().mockResolvedValue({
    data: [{ name: "image.webp" }],
    error: null,
  });

  const list = vi.fn().mockResolvedValue({
    data: [
      { name: "image-1.webp", metadata: { size: 102400 } },
      { name: "image-2.webp", metadata: { size: 204800 } },
    ],
    error: null,
  });

  const from = vi.fn().mockReturnValue({
    upload,
    getPublicUrl,
    createSignedUrl,
    remove,
    list,
  });

  return {
    from,
    upload,
    getPublicUrl,
    createSignedUrl,
    remove,
    list,
  };
}
