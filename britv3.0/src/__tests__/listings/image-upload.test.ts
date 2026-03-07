/**
 * Tests for image upload pipeline: validation, processing, and media service.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock sharp
vi.mock("sharp", () => {
  const sharpInstance = {
    rotate: vi.fn().mockReturnThis(),
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from("processed-image")),
    metadata: vi.fn().mockResolvedValue({ width: 2400, height: 1800 }),
  };
  const sharp = vi.fn().mockReturnValue(sharpInstance);
  return { default: sharp, __sharpInstance: sharpInstance };
});

// Mock file-type
vi.mock("file-type", () => ({
  fileTypeFromBuffer: vi.fn().mockResolvedValue({
    mime: "image/jpeg",
    ext: "jpg",
  }),
}));

// Mock crypto for UUID generation
vi.stubGlobal("crypto", {
  randomUUID: vi.fn().mockReturnValue("test-uuid-1234"),
});

describe("validateImageFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts JPEG files", async () => {
    const { validateImageFile } = await import("@/lib/upload/validate");
    const { fileTypeFromBuffer } = await import("file-type");
    vi.mocked(fileTypeFromBuffer).mockResolvedValueOnce({
      mime: "image/jpeg",
      ext: "jpg",
    });

    const result = await validateImageFile(Buffer.alloc(1024));
    expect(result.valid).toBe(true);
    expect(result.mime).toBe("image/jpeg");
  });

  it("accepts PNG files", async () => {
    const { validateImageFile } = await import("@/lib/upload/validate");
    const { fileTypeFromBuffer } = await import("file-type");
    vi.mocked(fileTypeFromBuffer).mockResolvedValueOnce({
      mime: "image/png",
      ext: "png",
    });

    const result = await validateImageFile(Buffer.alloc(1024));
    expect(result.valid).toBe(true);
    expect(result.mime).toBe("image/png");
  });

  it("accepts WebP files", async () => {
    const { validateImageFile } = await import("@/lib/upload/validate");
    const { fileTypeFromBuffer } = await import("file-type");
    vi.mocked(fileTypeFromBuffer).mockResolvedValueOnce({
      mime: "image/webp",
      ext: "webp",
    });

    const result = await validateImageFile(Buffer.alloc(1024));
    expect(result.valid).toBe(true);
    expect(result.mime).toBe("image/webp");
  });

  it("rejects non-image files", async () => {
    const { validateImageFile } = await import("@/lib/upload/validate");
    const { fileTypeFromBuffer } = await import("file-type");
    vi.mocked(fileTypeFromBuffer).mockResolvedValueOnce({
      mime: "application/pdf",
      ext: "pdf",
    });

    const result = await validateImageFile(Buffer.alloc(1024));
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("rejects files over 10MB", async () => {
    const { validateImageFile } = await import("@/lib/upload/validate");
    const { fileTypeFromBuffer } = await import("file-type");
    vi.mocked(fileTypeFromBuffer).mockResolvedValueOnce({
      mime: "image/jpeg",
      ext: "jpg",
    });

    const result = await validateImageFile(
      Buffer.alloc(11 * 1024 * 1024),
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("10MB");
  });
});

describe("processPropertyImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns processed and thumbnail buffers", async () => {
    const { processPropertyImage } = await import("@/lib/upload/process");

    const result = await processPropertyImage(Buffer.from("test-input"));

    expect(result.processed).toBeInstanceOf(Buffer);
    expect(result.thumbnail).toBeInstanceOf(Buffer);
  });

  it("calls sharp with auto-rotate and WebP conversion", async () => {
    const { processPropertyImage } = await import("@/lib/upload/process");
    const sharp = (await import("sharp")).default;

    await processPropertyImage(Buffer.from("test-input"));

    // sharp should be called with the input buffer
    expect(sharp).toHaveBeenCalledWith(Buffer.from("test-input"));

    const instance = vi.mocked(sharp).mock.results[0]?.value;
    expect(instance.rotate).toHaveBeenCalled();
    expect(instance.webp).toHaveBeenCalled();
  });

  it("generates 400x300 thumbnail", async () => {
    const { processPropertyImage } = await import("@/lib/upload/process");
    const sharp = (await import("sharp")).default;

    await processPropertyImage(Buffer.from("test-input"));

    const instance = vi.mocked(sharp).mock.results[1]?.value;
    expect(instance.resize).toHaveBeenCalledWith(
      400,
      300,
      expect.objectContaining({ fit: "cover" }),
    );
  });
});

describe("uploadPropertyImage (media service)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores processed + thumbnail in Supabase Storage", async () => {
    const { uploadPropertyImage } = await import(
      "@/services/listings/media-service"
    );

    // Mock chains
    const ownershipChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "listing-001", user_id: "user-001" },
        error: null,
      }),
    };

    const countChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((cb: (result: unknown) => void) => {
        return Promise.resolve(
          cb({ data: [{ id: "1" }, { id: "2" }], error: null, count: 2 }),
        );
      }),
    };

    const maxSortChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { sort_order: 1 },
        error: null,
      }),
    };

    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "media-new",
          listing_id: "listing-001",
          media_type: "image",
          url: "https://storage.supabase.co/property-images/listing-001/test-uuid-1234.webp",
          thumbnail_url: "https://storage.supabase.co/property-images/listing-001/test-uuid-1234-thumb.webp",
          sort_order: 2,
        },
        error: null,
      }),
    };

    let listingCalls = 0;
    let mediaCalls = 0;
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "listings") {
        listingCalls++;
        return ownershipChain;
      }
      if (table === "property_media") {
        mediaCalls++;
        if (mediaCalls === 1) return countChain;
        if (mediaCalls === 2) return maxSortChain;
        return insertChain;
      }
      return ownershipChain;
    });

    const upload = vi.fn().mockResolvedValue({ data: { path: "test" }, error: null });
    const getPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: "https://storage.supabase.co/property-images/listing-001/test-uuid-1234.webp" },
    });

    const storage = {
      from: vi.fn().mockReturnValue({ upload, getPublicUrl }),
    };

    const sb = { from, storage, rpc: vi.fn() };

    const result = await uploadPropertyImage(
      sb as never,
      "user-001",
      "listing-001",
      Buffer.alloc(1024),
      "test-image.jpg",
    );

    // Should upload twice (processed + thumbnail)
    expect(storage.from).toHaveBeenCalledWith("property-images");
    expect(upload).toHaveBeenCalledTimes(2);
    expect(result.media_type).toBe("image");
  });

  it("rejects when listing already has 30 images", async () => {
    const { uploadPropertyImage } = await import(
      "@/services/listings/media-service"
    );

    const ownershipChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "listing-001", user_id: "user-001" },
        error: null,
      }),
    };

    // Count returns 30
    const countChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((cb: (result: unknown) => void) => {
        return Promise.resolve(
          cb({ data: Array.from({ length: 30 }, (_, i) => ({ id: String(i) })), error: null, count: 30 }),
        );
      }),
    };

    let mediaCalls = 0;
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "listings") return ownershipChain;
      if (table === "property_media") {
        mediaCalls++;
        return countChain;
      }
      return ownershipChain;
    });

    const sb = { from, storage: { from: vi.fn() }, rpc: vi.fn() };

    await expect(
      uploadPropertyImage(
        sb as never,
        "user-001",
        "listing-001",
        Buffer.alloc(1024),
        "test.jpg",
      ),
    ).rejects.toThrow("30");
  });
});

describe("deletePropertyImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes from storage and deletes database record", async () => {
    const { deletePropertyImage } = await import(
      "@/services/listings/media-service"
    );

    // Media lookup chain
    const mediaChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "media-001",
          listing_id: "listing-001",
          url: "https://storage.supabase.co/property-images/listing-001/img.webp",
          thumbnail_url: "https://storage.supabase.co/property-images/listing-001/img-thumb.webp",
        },
        error: null,
      }),
    };

    // Listing ownership chain
    const listingChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "listing-001", user_id: "user-001" },
        error: null,
      }),
    };

    // Delete chain
    const deleteChain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };

    let mediaCalls = 0;
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "property_media") {
        mediaCalls++;
        return mediaCalls === 1 ? mediaChain : deleteChain;
      }
      if (table === "listings") return listingChain;
      return mediaChain;
    });

    const remove = vi.fn().mockResolvedValue({ error: null });
    const storage = {
      from: vi.fn().mockReturnValue({ remove }),
    };

    const sb = { from, storage };

    await deletePropertyImage(sb as never, "user-001", "media-001");

    expect(remove).toHaveBeenCalled();
    expect(deleteChain.delete).toHaveBeenCalled();
  });
});

describe("reorderMedia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates sort_order for each media ID", async () => {
    const { reorderMedia } = await import(
      "@/services/listings/media-service"
    );

    // Listing ownership check
    const listingChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "listing-001", user_id: "user-001" },
        error: null,
      }),
    };

    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      match: vi.fn().mockResolvedValue({ error: null }),
    };

    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "listings") return listingChain;
      if (table === "property_media") return updateChain;
      return listingChain;
    });

    const sb = { from };

    await reorderMedia(sb as never, "user-001", "listing-001", [
      "media-003",
      "media-001",
      "media-002",
    ]);

    // Should call update for each media ID
    expect(updateChain.update).toHaveBeenCalledTimes(3);
  });
});
