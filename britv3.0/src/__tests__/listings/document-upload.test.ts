/**
 * Tests for document upload (floor plans, EPC certificates).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock sharp
vi.mock("sharp", () => {
  const sharpInstance = {
    rotate: vi.fn().mockReturnThis(),
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from("processed")),
    metadata: vi.fn().mockResolvedValue({ width: 2400, height: 1800 }),
  };
  return { default: vi.fn().mockReturnValue(sharpInstance) };
});

// Mock file-type
vi.mock("file-type", () => ({
  fileTypeFromBuffer: vi.fn().mockResolvedValue({
    mime: "application/pdf",
    ext: "pdf",
  }),
}));

vi.stubGlobal("crypto", {
  randomUUID: vi.fn().mockReturnValue("doc-uuid-5678"),
});

describe("validateDocumentFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts PDF files for floor plans", async () => {
    const { validateDocumentFile } = await import("@/lib/upload/validate");
    const { fileTypeFromBuffer } = await import("file-type");
    vi.mocked(fileTypeFromBuffer).mockResolvedValueOnce({
      mime: "application/pdf",
      ext: "pdf",
    });

    const result = await validateDocumentFile(Buffer.alloc(1024));
    expect(result.valid).toBe(true);
    expect(result.mime).toBe("application/pdf");
  });

  it("accepts JPEG files for floor plan images", async () => {
    const { validateDocumentFile } = await import("@/lib/upload/validate");
    const { fileTypeFromBuffer } = await import("file-type");
    vi.mocked(fileTypeFromBuffer).mockResolvedValueOnce({
      mime: "image/jpeg",
      ext: "jpg",
    });

    const result = await validateDocumentFile(Buffer.alloc(1024));
    expect(result.valid).toBe(true);
  });

  it("rejects unsupported file types", async () => {
    const { validateDocumentFile } = await import("@/lib/upload/validate");
    const { fileTypeFromBuffer } = await import("file-type");
    vi.mocked(fileTypeFromBuffer).mockResolvedValueOnce({
      mime: "application/zip",
      ext: "zip",
    });

    const result = await validateDocumentFile(Buffer.alloc(1024));
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe("uploadFloorPlan (media service)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores floor plan in property-documents bucket with media_type floor_plan", async () => {
    const { uploadFloorPlan } = await import(
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

    const maxSortChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { sort_order: 3 },
        error: null,
      }),
    };

    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "media-fp",
          listing_id: "listing-001",
          media_type: "floor_plan",
          url: "https://storage.supabase.co/property-documents/listing-001/doc-uuid-5678.pdf",
          thumbnail_url: null,
          sort_order: 4,
        },
        error: null,
      }),
    };

    let mediaCalls = 0;
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "listings") return ownershipChain;
      if (table === "property_media") {
        mediaCalls++;
        return mediaCalls === 1 ? maxSortChain : insertChain;
      }
      return ownershipChain;
    });

    const upload = vi.fn().mockResolvedValue({ data: { path: "test" }, error: null });
    const getPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: "https://storage.supabase.co/property-documents/listing-001/doc-uuid-5678.pdf" },
    });

    const storage = {
      from: vi.fn().mockReturnValue({ upload, getPublicUrl }),
    };

    const sb = { from, storage };

    const result = await uploadFloorPlan(
      sb as never,
      "user-001",
      "listing-001",
      Buffer.alloc(2048),
      "floorplan.pdf",
    );

    expect(storage.from).toHaveBeenCalledWith("property-documents");
    // Only 1 upload (no thumbnail for PDFs)
    expect(upload).toHaveBeenCalledTimes(1);
    expect(result.media_type).toBe("floor_plan");
  });
});
