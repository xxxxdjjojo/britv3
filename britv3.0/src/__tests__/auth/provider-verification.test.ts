import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";

// Mock the browser client for verification-service
const mockClient = createMockSupabaseClient();
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => mockClient),
}));

import {
  getVerificationStatus,
  submitVerification,
  getVerificationProgress,
} from "@/services/auth/verification-service";

describe("getVerificationStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array for new user with no verification records", async () => {
    const mockFrom = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    mockClient.from.mockReturnValue(mockFrom);

    const result = await getVerificationStatus("user-new");

    expect(mockClient.from).toHaveBeenCalledWith("provider_verifications");
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it("returns verification records ordered by stage", async () => {
    const mockRecords = [
      { id: "1", user_id: "user-1", stage: "email", status: "approved" },
      { id: "2", user_id: "user-1", stage: "phone", status: "submitted" },
    ];
    const mockFrom = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockRecords, error: null }),
    };
    mockClient.from.mockReturnValue(mockFrom);

    const result = await getVerificationStatus("user-1");

    expect(result.data).toEqual(mockRecords);
    expect(result.error).toBeNull();
  });
});

describe("submitVerification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates record with submitted status for valid stage", async () => {
    // First call: select existing verifications (email approved)
    const mockSelectFrom = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{ id: "1", user_id: "user-1", stage: "email", status: "approved" }],
        error: null,
      }),
    };
    // Second call: upsert
    const mockUpsertFrom = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "2", user_id: "user-1", stage: "phone", status: "submitted" },
        error: null,
      }),
    };

    let callCount = 0;
    mockClient.from.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? mockSelectFrom : mockUpsertFrom;
    });

    const result = await submitVerification("user-1", "phone");

    expect(result.error).toBeNull();
    expect(result.data?.status).toBe("submitted");
  });

  it("rejects out-of-order stage submission", async () => {
    // User has no approved stages, trying to submit "phone" (needs email first)
    const mockSelectFrom = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    mockClient.from.mockReturnValue(mockSelectFrom);

    const result = await submitVerification("user-1", "phone");

    expect(result.error).not.toBeNull();
    expect(result.error?.message).toContain("previous");
  });

  it("rejects admin_review stage submission by user", async () => {
    const mockSelectFrom = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { stage: "email", status: "approved" },
          { stage: "phone", status: "approved" },
          { stage: "identity", status: "approved" },
          { stage: "insurance", status: "approved" },
          { stage: "qualifications", status: "approved" },
        ],
        error: null,
      }),
    };
    mockClient.from.mockReturnValue(mockSelectFrom);

    const result = await submitVerification("user-1", "admin_review");

    expect(result.error).not.toBeNull();
    expect(result.error?.message).toContain("admin");
  });
});

describe("getVerificationProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("computes percentage and current stage correctly for partial progress", async () => {
    const mockFrom = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { stage: "email", status: "approved" },
          { stage: "phone", status: "approved" },
          { stage: "identity", status: "submitted" },
        ],
        error: null,
      }),
    };
    mockClient.from.mockReturnValue(mockFrom);

    const result = await getVerificationProgress("user-1");

    expect(result.data).not.toBeNull();
    expect(result.data?.completedStages).toEqual(["email", "phone"]);
    expect(result.data?.currentStage).toBe("identity");
    expect(result.data?.level).toBe("standard");
    expect(result.data?.percentage).toBeCloseTo(33.33, 0);
  });

  it("returns 0% and email as current stage for new user", async () => {
    const mockFrom = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    mockClient.from.mockReturnValue(mockFrom);

    const result = await getVerificationProgress("user-new");

    expect(result.data).not.toBeNull();
    expect(result.data?.completedStages).toEqual([]);
    expect(result.data?.currentStage).toBe("email");
    expect(result.data?.level).toBe("basic");
    expect(result.data?.percentage).toBe(0);
  });

  it("returns 100% when all stages approved", async () => {
    const allApproved = [
      { stage: "email", status: "approved" },
      { stage: "phone", status: "approved" },
      { stage: "identity", status: "approved" },
      { stage: "insurance", status: "approved" },
      { stage: "qualifications", status: "approved" },
      { stage: "admin_review", status: "approved" },
    ];
    const mockFrom = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: allApproved, error: null }),
    };
    mockClient.from.mockReturnValue(mockFrom);

    const result = await getVerificationProgress("user-pro");

    expect(result.data?.completedStages).toHaveLength(6);
    expect(result.data?.currentStage).toBeNull();
    expect(result.data?.level).toBe("professional");
    expect(result.data?.percentage).toBe(100);
  });
});
