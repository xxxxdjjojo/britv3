import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "@/__tests__/mocks/supabase";

// Mock geocoding
vi.mock("@/services/geocoding/postcodes-io", () => ({
  geocodePostcode: vi.fn().mockResolvedValue({
    postcode: "SW1A 1AA",
    latitude: 51.501,
    longitude: -0.141,
    admin_district: "Westminster",
    region: "London",
  }),
}));

// Mock file-validator
vi.mock("@/lib/marketplace/file-validator", () => ({
  validateFile: vi.fn().mockResolvedValue({ mime: "application/pdf", ext: "pdf" }),
  sanitizeBuffer: vi.fn().mockImplementation((buffer: Buffer) => Promise.resolve(buffer)),
}));

import {
  createProviderProfile,
  updateProviderProfile,
  getProviderBySlug,
  getProviderProfile,
  searchProviders,
  uploadProviderDocument,
  getProviderDocuments,
} from "./provider-service";

const validProfileInput = {
  business_name: "London Plumbing Co",
  business_description:
    "Professional plumbing services across London with over 20 years of experience in residential and commercial plumbing.",
  services: ["plumber"] as ("plumber")[],
  service_postcodes: ["SW1A 1AA"],
  service_radius: 25,
  years_in_business: 10,
};

describe("provider-service", () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;
  let mockQueryBuilder: ReturnType<typeof createChainableMock>;

  function createChainableMock(resolvedValue: unknown = null) {
    const builder: Record<string, unknown> = {};
    const chainMethods = [
      "select", "insert", "update", "delete", "upsert",
      "eq", "neq", "gt", "gte", "lt", "lte",
      "like", "ilike", "is", "in", "contains",
      "order", "limit", "offset",
    ];

    for (const method of chainMethods) {
      builder[method] = vi.fn().mockReturnValue(builder);
    }

    builder.single = vi.fn().mockResolvedValue({
      data: resolvedValue,
      error: null,
    });
    builder.maybeSingle = vi.fn().mockResolvedValue({
      data: resolvedValue,
      error: null,
    });

    return builder;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockSupabaseClient();
  });

  describe("createProviderProfile", () => {
    it("generates slug and calls insert", async () => {
      const createdRecord = {
        ...validProfileInput,
        user_id: "user-1",
        slug: "london-plumbing-co",
        created_at: new Date(),
        updated_at: new Date(),
      };

      // First call: slug uniqueness check (no existing)
      const slugCheckBuilder = createChainableMock(null);
      // Second call: the actual insert
      const insertBuilder = createChainableMock(createdRecord);

      let callCount = 0;
      mockClient.from = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return slugCheckBuilder;
        return insertBuilder;
      });

      const result = await createProviderProfile(
        mockClient as never,
        "user-1",
        validProfileInput
      );

      expect(result).toEqual(createdRecord);
      expect(mockClient.from).toHaveBeenCalledWith("service_provider_details");
      expect(insertBuilder.insert).toHaveBeenCalled();
    });

    it("appends suffix when slug exists", async () => {
      const createdRecord = {
        ...validProfileInput,
        user_id: "user-1",
        slug: "london-plumbing-co-2",
      };

      // First call: slug check returns existing
      const slugCheckExisting = createChainableMock({ slug: "london-plumbing-co" });
      // Second call: slug check with -2 returns null
      const slugCheckFree = createChainableMock(null);
      // Third call: insert
      const insertBuilder = createChainableMock(createdRecord);

      let callCount = 0;
      mockClient.from = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return slugCheckExisting;
        if (callCount === 2) return slugCheckFree;
        return insertBuilder;
      });

      const result = await createProviderProfile(
        mockClient as never,
        "user-1",
        validProfileInput
      );

      expect(result.slug).toBe("london-plumbing-co-2");
    });
  });

  describe("updateProviderProfile", () => {
    it("calls update with correct filters", async () => {
      const updatedRecord = {
        ...validProfileInput,
        user_id: "user-1",
        business_name: "Updated Plumbing Co",
        slug: "updated-plumbing-co",
      };

      // First call: slug uniqueness check for new name
      const slugCheckBuilder = createChainableMock(null);
      // Second call: update
      const updateBuilder = createChainableMock(updatedRecord);

      let callCount = 0;
      mockClient.from = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return slugCheckBuilder;
        return updateBuilder;
      });

      const result = await updateProviderProfile(
        mockClient as never,
        "user-1",
        { business_name: "Updated Plumbing Co" }
      );

      expect(result).toEqual(updatedRecord);
      expect(updateBuilder.update).toHaveBeenCalled();
      expect(updateBuilder.eq).toHaveBeenCalledWith("user_id", "user-1");
    });
  });

  describe("searchProviders", () => {
    it("calls RPC with correct parameters", async () => {
      const providers = [
        { user_id: "p1", business_name: "Provider 1", slug: "provider-1" },
      ];

      mockClient.rpc = vi.fn().mockResolvedValue({
        data: providers,
        error: null,
      });

      const result = await searchProviders(mockClient as never, {
        service_category: "plumber",
        postcode: "SW1A 1AA",
        radius: 10,
        min_rating: 4,
      });

      expect(mockClient.rpc).toHaveBeenCalledWith(
        "search_providers",
        expect.objectContaining({
          p_service_category: "plumber",
          p_latitude: 51.501,
          p_longitude: -0.141,
          p_radius_miles: 10,
          p_min_rating: 4,
        })
      );

      expect(result.data).toEqual(providers);
      expect(result.count).toBe(1);
    });

    it("handles search without postcode", async () => {
      mockClient.rpc = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      await searchProviders(mockClient as never, {
        service_category: "electrician",
        radius: 25,
      });

      expect(mockClient.rpc).toHaveBeenCalledWith("search_providers", {
        p_service_category: "electrician",
      });
    });
  });

  describe("uploadProviderDocument", () => {
    it("validates file and calls storage upload", async () => {
      const pdfBuffer = Buffer.from("fake-pdf-content");
      const docRecord = {
        id: "doc-1",
        user_id: "user-1",
        document_type: "insurance_certificate",
        file_name: "insurance.pdf",
        file_url: "https://storage.example.com/path/to/file.pdf",
        file_size: pdfBuffer.length,
        mime_type: "application/pdf",
        verification_status: "pending",
      };

      // Mock storage upload
      const storageBucket = {
        upload: vi.fn().mockResolvedValue({ data: { path: "test" }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: "https://storage.example.com/path/to/file.pdf" },
        }),
      };
      mockClient.storage.from = vi.fn().mockReturnValue(storageBucket);

      // Mock from() calls: insert doc, update profiles
      const insertBuilder = createChainableMock(docRecord);
      const updateBuilder = createChainableMock(null);

      let callCount = 0;
      mockClient.from = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return insertBuilder;
        return updateBuilder;
      });

      const result = await uploadProviderDocument(
        mockClient as never,
        "user-1",
        pdfBuffer,
        "insurance_certificate",
        "insurance.pdf"
      );

      expect(result).toEqual(docRecord);
      expect(mockClient.storage.from).toHaveBeenCalledWith("provider-docs");
      expect(storageBucket.upload).toHaveBeenCalled();
      expect(insertBuilder.insert).toHaveBeenCalled();
    });
  });

  describe("getProviderBySlug", () => {
    it("returns null for non-existent slug", async () => {
      mockQueryBuilder = createChainableMock(null);
      mockClient.from = vi.fn().mockReturnValue(mockQueryBuilder);

      const result = await getProviderBySlug(
        mockClient as never,
        "non-existent-slug"
      );

      expect(result).toBeNull();
      expect(mockClient.from).toHaveBeenCalledWith("service_provider_details");
    });

    it("returns provider data for valid slug", async () => {
      const provider = {
        user_id: "p1",
        business_name: "Test Provider",
        slug: "test-provider",
        profiles: { full_name: "John", avatar_url: null },
        provider_rating_stats: { average_rating: 4.5 },
      };

      mockQueryBuilder = createChainableMock(provider);
      mockClient.from = vi.fn().mockReturnValue(mockQueryBuilder);

      const result = await getProviderBySlug(
        mockClient as never,
        "test-provider"
      );

      expect(result).toEqual(provider);
    });
  });

  describe("getProviderProfile", () => {
    it("returns own profile by user_id", async () => {
      const profile = {
        user_id: "user-1",
        business_name: "My Business",
        slug: "my-business",
      };

      mockQueryBuilder = createChainableMock(profile);
      mockClient.from = vi.fn().mockReturnValue(mockQueryBuilder);

      const result = await getProviderProfile(mockClient as never, "user-1");

      expect(result).toEqual(profile);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", "user-1");
    });
  });

  describe("getProviderDocuments", () => {
    it("returns documents for provider", async () => {
      const docs = [
        { id: "doc-1", document_type: "identity_proof" },
        { id: "doc-2", document_type: "insurance_certificate" },
      ];

      const builder = createChainableMock(null);
      // Override: order returns a resolved promise with data array
      (builder.order as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: docs,
        error: null,
      });

      mockClient.from = vi.fn().mockReturnValue(builder);

      const result = await getProviderDocuments(mockClient as never, "user-1");

      expect(result).toEqual(docs);
      expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1");
    });
  });
});
