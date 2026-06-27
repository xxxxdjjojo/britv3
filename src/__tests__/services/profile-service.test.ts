import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";
import { createMockRedis } from "../mocks/redis";

// Mock redis module
const mockRedis = createMockRedis();
vi.mock("@/lib/cache/redis", () => ({
  invalidateCache: vi.fn(),
  invalidateCachePattern: vi.fn(),
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

// Mock sanitize module
// profile-service imports sanitizeText from the jsdom-free sanitize-text module.
vi.mock("@/lib/validation/sanitize-text", () => ({
  sanitizeText: vi.fn((text: string) => text.replace(/<[^>]*>/g, "")),
}));

// Mock sharp
vi.mock("sharp", () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from("fake-image")),
  })),
}));

// Mock file-type
vi.mock("file-type", () => ({
  fileTypeFromBuffer: vi.fn().mockResolvedValue({ mime: "image/jpeg", ext: "jpg" }),
}));

import {
  getProfile,
  updateProfile,
  uploadAvatar,
  updateProviderProfile,
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/services/profile/profile-service";
import { invalidateCachePattern } from "@/lib/cache/redis";
import { sanitizeText } from "@/lib/validation/sanitize-text";

describe("profile-service", () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // getProfile
  // -------------------------------------------------------------------------

  describe("getProfile", () => {
    it("returns profile data for valid user ID", async () => {
      const profileData = {
        id: "user-1",
        display_name: "Test User",
        active_role: "homebuyer",
        avatar_url: null,
        phone: "+44 7700 900000",
      };

      const queryBuilder = mockClient.from("profiles");
      (queryBuilder.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: profileData,
        error: null,
      });

      const result = await getProfile(mockClient as never, "user-1");

      expect(result).toEqual(profileData);
      expect(mockClient.from).toHaveBeenCalledWith("profiles");
    });
  });

  // -------------------------------------------------------------------------
  // updateProfile
  // -------------------------------------------------------------------------

  describe("updateProfile", () => {
    it("sanitizes display_name before saving", async () => {
      const queryBuilder = mockClient.from("profiles");
      (queryBuilder.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: "user-1", display_name: "Clean Name" },
        error: null,
      });

      await updateProfile(mockClient as never, "user-1", {
        display_name: "<script>alert('xss')</script>Clean Name",
      });

      expect(sanitizeText).toHaveBeenCalledWith(
        "<script>alert('xss')</script>Clean Name",
      );
    });

    it("rejects display_name shorter than 2 chars", async () => {
      await expect(
        updateProfile(mockClient as never, "user-1", {
          display_name: "A",
        }),
      ).rejects.toThrow();
    });

    it("rejects invalid UK phone format", async () => {
      await expect(
        updateProfile(mockClient as never, "user-1", {
          display_name: "Valid Name",
          phone: "12345",
        }),
      ).rejects.toThrow();
    });

    it("invalidates dashboard cache after update", async () => {
      const queryBuilder = mockClient.from("profiles");
      (queryBuilder.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: "user-1", display_name: "Updated" },
        error: null,
      });

      await updateProfile(mockClient as never, "user-1", {
        display_name: "Updated Name",
      });

      expect(invalidateCachePattern).toHaveBeenCalledWith("dashboard:user-1:*");
    });
  });

  // -------------------------------------------------------------------------
  // updateProviderProfile
  // -------------------------------------------------------------------------

  describe("updateProviderProfile", () => {
    it("rejects non-service_provider role", async () => {
      const queryBuilder = mockClient.from("profiles");
      (queryBuilder.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { active_role: "homebuyer" },
        error: null,
      });

      await expect(
        updateProviderProfile(mockClient as never, "user-1", {
          services: [{ category: "Plumbing", description: "Fix pipes" }],
          coverage_postcodes: ["SW1A"],
          pricing: { "Basic repair": 50 },
        }),
      ).rejects.toThrow("Only service providers");
    });
  });

  // -------------------------------------------------------------------------
  // Notification preferences
  // -------------------------------------------------------------------------

  describe("updateNotificationPreferences", () => {
    it("validates preferences shape", async () => {
      await expect(
        updateNotificationPreferences(mockClient as never, "user-1", {
          per_type: "invalid",
        }),
      ).rejects.toThrow();
    });
  });

  describe("getNotificationPreferences", () => {
    it("returns default when no preferences set", async () => {
      const queryBuilder = mockClient.from("profiles");
      (queryBuilder.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { preferences: null },
        error: null,
      });

      const result = await getNotificationPreferences(mockClient as never, "user-1");

      expect(result.digest_frequency).toBe("daily");
      expect(result.quiet_hours.enabled).toBe(false);
      expect(result.per_type.new_message).toEqual({
        in_app: true,
        email: true,
        push: false,
        sms: false,
      });
    });
  });
});
