/**
 * Tests for provider-profile-service.
 *
 * Functions under contract:
 *  - getProviderProfile(supabase, userId)
 *  - updateProviderProfile(supabase, userId, updates)
 *  - uploadAvatar(supabase, userId, file)
 *
 * All monetary values are in pence (GBP x 100).
 */

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import {
  getProviderProfile,
  updateProviderProfile,
  uploadAvatar,
} from "../provider-profile-service";

import type { ServiceProviderDetails, ProviderProfileUpdates } from "../provider-profile-service";

// ---------------------------------------------------------------------------
// Helpers to build a chainable Supabase query mock
// ---------------------------------------------------------------------------

function makeQueryMock(resolveValue: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "from", "select", "insert", "update", "upsert", "delete",
    "eq", "neq", "in", "not", "gte", "lte", "gt", "lt",
    "order", "limit", "range", "maybeSingle", "single",
  ];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  (chain["maybeSingle"] as ReturnType<typeof vi.fn>).mockResolvedValue(resolveValue);
  (chain["single"] as ReturnType<typeof vi.fn>).mockResolvedValue(resolveValue);
  (chain as unknown as { then: Promise<unknown>["then"] }).then = Promise.resolve(
    resolveValue,
  ).then.bind(Promise.resolve(resolveValue));
  return chain as unknown as ReturnType<typeof import("@supabase/supabase-js").createClient>;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const sampleProfile: ServiceProviderDetails = {
  id: "sp-uuid-1",
  user_id: "user-uuid-1",
  business_name: "Acme Plumbing Ltd",
  services: ["plumbing", "boiler repair"],
  description: "Professional plumbing services across London",
  hourly_rate: 5500,
  avatar_url: "https://storage.example.com/avatars/providers/user-uuid-1/avatar.jpg",
  phone: "+447700900123",
  website: "https://acmeplumbing.co.uk",
  address: "123 High Street",
  city: "London",
  postcode: "SW1A 1AA",
  years_experience: 12,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-03-15T12:00:00Z",
};

const profileClient = makeQueryMock({ data: sampleProfile, error: null });
const nullClient = makeQueryMock({ data: null, error: null });

const REQUIRED_PROFILE_KEYS: (keyof ServiceProviderDetails)[] = [
  "id", "user_id", "business_name", "services", "description",
  "hourly_rate", "avatar_url", "phone", "website", "address",
  "city", "postcode", "years_experience", "created_at", "updated_at",
];

// ---------------------------------------------------------------------------
// getProviderProfile
// ---------------------------------------------------------------------------

describe("getProviderProfile", () => {
  it("returns correct shape for an existing provider", async () => {
    const result = await getProviderProfile(profileClient, "user-uuid-1");

    expect(result).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        user_id: expect.any(String),
        business_name: expect.any(String),
        services: expect.any(Array),
        created_at: expect.any(String),
        updated_at: expect.any(String),
      }),
    );
  });

  it("returns null for a non-existent user", async () => {
    const result = await getProviderProfile(nullClient, "user-uuid-nonexistent");

    expect(result).toBeNull();
  });

  it("includes all required fields (no missing keys)", async () => {
    const result = await getProviderProfile(profileClient, "user-uuid-1");

    expect(result).not.toBeNull();
    for (const key of REQUIRED_PROFILE_KEYS) {
      expect(result).toHaveProperty(key);
    }
  });
});

// ---------------------------------------------------------------------------
// updateProviderProfile
// ---------------------------------------------------------------------------

describe("updateProviderProfile", () => {
  it("returns the updated profile", async () => {
    const updates: ProviderProfileUpdates = {
      business_name: "Updated Plumbing Co",
      city: "Manchester",
    };

    const result = await updateProviderProfile(profileClient, "sp-uuid-1", updates);

    expect(result).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        user_id: expect.any(String),
      }),
    );
  });

  it("validates business_name minimum length (2 chars)", async () => {
    const updates: ProviderProfileUpdates = {
      business_name: "A", // Too short
    };

    await expect(
      updateProviderProfile(profileClient, "sp-uuid-1", updates),
    ).rejects.toThrow(/at least 2 characters/);
  });

  it("validates business_name maximum length (100 chars)", async () => {
    const updates: ProviderProfileUpdates = {
      business_name: "A".repeat(101), // Too long
    };

    await expect(
      updateProviderProfile(profileClient, "sp-uuid-1", updates),
    ).rejects.toThrow(/at most 100 characters/);
  });

  it("accepts a valid business_name within range", async () => {
    const updates: ProviderProfileUpdates = {
      business_name: "Valid Business Name",
    };

    await expect(
      updateProviderProfile(profileClient, "sp-uuid-1", updates),
    ).resolves.toBeDefined();
  });

  it("validates website URL format", async () => {
    const updates: ProviderProfileUpdates = {
      website: "not-a-valid-url",
    };

    await expect(
      updateProviderProfile(profileClient, "sp-uuid-1", updates),
    ).rejects.toThrow(/Invalid website URL|invalid_string|url/i);
  });

  it("accepts a valid website URL", async () => {
    const updates: ProviderProfileUpdates = {
      website: "https://example.co.uk",
    };

    await expect(
      updateProviderProfile(profileClient, "sp-uuid-1", updates),
    ).resolves.toBeDefined();
  });

  it("accepts an empty string for website (clearing the field)", async () => {
    const updates: ProviderProfileUpdates = {
      website: "",
    };

    await expect(
      updateProviderProfile(profileClient, "sp-uuid-1", updates),
    ).resolves.toBeDefined();
  });

  it("accepts valid phone number format", async () => {
    const updates: ProviderProfileUpdates = {
      phone: "+447700900456",
    };

    await expect(
      updateProviderProfile(profileClient, "sp-uuid-1", updates),
    ).resolves.toBeDefined();
  });

  it("accepts valid postcode format", async () => {
    const updates: ProviderProfileUpdates = {
      postcode: "EC2A 4NE",
    };

    await expect(
      updateProviderProfile(profileClient, "sp-uuid-1", updates),
    ).resolves.toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// uploadAvatar
// ---------------------------------------------------------------------------

describe("uploadAvatar", () => {
  function makeStorageClient(uploadResult: unknown, publicUrl: string, updateResult: unknown) {
    const chain: Record<string, unknown> = {};
    const methods = [
      "from", "select", "insert", "update", "upsert", "delete",
      "eq", "neq", "in", "not", "gte", "lte", "gt", "lt",
      "order", "limit", "range", "maybeSingle", "single",
    ];
    for (const m of methods) {
      chain[m] = vi.fn(() => chain);
    }
    (chain as unknown as { then: Promise<unknown>["then"] }).then = Promise.resolve(
      updateResult,
    ).then.bind(Promise.resolve(updateResult));

    const storageBucket = {
      upload: vi.fn().mockResolvedValue(uploadResult),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl } }),
    };

    return {
      ...chain,
      storage: {
        from: vi.fn(() => storageBucket),
      },
    } as unknown as ReturnType<typeof import("@supabase/supabase-js").createClient>;
  }

  it("validates file type (rejects non-image files)", async () => {
    const client = makeStorageClient(
      { error: { message: "Invalid file type" } },
      "",
      { data: null, error: null },
    );

    const fakeFile = new File(["text content"], "document.pdf", {
      type: "application/pdf",
    });

    await expect(uploadAvatar(client, "user-uuid-1", fakeFile)).rejects.toThrow();
  });

  it("uploads image and returns public URL", async () => {
    const expectedUrl = "https://storage.example.com/avatars/providers/user-uuid-1/avatar.jpg";
    const client = makeStorageClient(
      { error: null },
      expectedUrl,
      { data: null, error: null },
    );

    const fakeFile = new File(["image data"], "photo.jpg", {
      type: "image/jpeg",
    });

    const result = await uploadAvatar(client, "user-uuid-1", fakeFile);

    expect(result).toBe(expectedUrl);
    expect(typeof result).toBe("string");
    expect(result).toContain("https://");
  });

  it("throws when storage upload fails", async () => {
    const client = makeStorageClient(
      { error: { message: "Upload quota exceeded" } },
      "",
      { data: null, error: null },
    );

    const fakeFile = new File(["image data"], "photo.jpg", {
      type: "image/jpeg",
    });

    await expect(uploadAvatar(client, "user-uuid-1", fakeFile)).rejects.toThrow(
      /Avatar upload failed/,
    );
  });

  it("throws when profile avatar_url update fails", async () => {
    const expectedUrl = "https://storage.example.com/avatars/providers/user-uuid-1/avatar.png";
    const client = makeStorageClient(
      { error: null },
      expectedUrl,
      { data: null, error: { message: "RLS policy violation" } },
    );

    const fakeFile = new File(["image data"], "photo.png", {
      type: "image/png",
    });

    await expect(uploadAvatar(client, "user-uuid-1", fakeFile)).rejects.toThrow(
      /Failed to update avatar URL/,
    );
  });
});
