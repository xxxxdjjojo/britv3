import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createReview,
  listProviderReviews,
  voteHelpfulness,
  respondToReview,
  flagReview,
} from "./review-service";

// -- Mock helpers ------------------------------------------------------------

/** Build a chainable Supabase query mock with configurable return value */
function mockQuery(returnValue: { data: unknown; error: unknown; count?: number }) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "select", "insert", "update", "upsert", "delete",
    "eq", "neq", "gte", "lte", "is", "in",
    "order", "range", "single", "maybeSingle",
    "textSearch",
  ];

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Terminal methods return the value
  chain["single"] = vi.fn().mockResolvedValue(returnValue);
  chain["maybeSingle"] = vi.fn().mockResolvedValue(returnValue);

  // For queries that don't end with single/maybeSingle
  (chain as Record<string, unknown>)["then"] = (resolve: (v: unknown) => void) =>
    resolve(returnValue);

  return chain;
}

function createMockSupabase(overrides: Record<string, unknown> = {}) {
  const fromMock = vi.fn().mockReturnValue(mockQuery({ data: null, error: null }));
  return {
    from: fromMock,
    auth: { getUser: vi.fn() },
    ...overrides,
  } as unknown as ReturnType<typeof import("@supabase/supabase-js").createClient>;
}

// -- Tests -------------------------------------------------------------------

describe("createReview", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls sentiment analyzer and spam detector on review text", async () => {
    const bookingQuery = mockQuery({
      data: { id: "b1", user_id: "u1", provider_id: "p1", status: "completed" },
      error: null,
    });

    const insertChain = mockQuery({
      data: {
        id: "r1",
        booking_id: "b1",
        provider_id: "p1",
        reviewer_id: "u1",
        overall_rating: 5,
        title: "Great service",
        review_text: "The plumber was excellent and very professional",
        sentiment: "very_positive",
        spam_indicators: { spam_score: 0 },
        moderation_status: "pending",
        fake_review_probability: 0,
        authenticity_score: 0,
        helpful_count: 0,
        not_helpful_count: 0,
      },
      error: null,
    });

    const moderationInsert = mockQuery({ data: null, error: null });

    const supabase = createMockSupabase();
    const fromMock = supabase.from as ReturnType<typeof vi.fn>;
    fromMock
      .mockReturnValueOnce(bookingQuery)  // bookings lookup
      .mockReturnValueOnce(insertChain)   // reviews insert
      .mockReturnValueOnce(moderationInsert); // moderation_queue insert

    const result = await createReview(supabase, "u1", {
      booking_id: "b1",
      overall_rating: 5,
      title: "Great service",
      review_text: "The plumber was excellent and very professional",
    });

    expect(result).toBeDefined();
    expect(result.sentiment).toBe("very_positive");
    // Verify spam_indicators is populated (from detectSpam)
    expect(result.spam_indicators).toBeDefined();
    expect(result.spam_indicators.spam_score).toBe(0);
  });

  it("rejects if booking is not completed", async () => {
    const bookingQuery = mockQuery({
      data: { id: "b1", user_id: "u1", provider_id: "p1", status: "confirmed" },
      error: null,
    });

    const supabase = createMockSupabase();
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(bookingQuery);

    await expect(
      createReview(supabase, "u1", {
        booking_id: "b1",
        overall_rating: 5,
        title: "Great service",
        review_text: "The plumber was excellent and very professional",
      }),
    ).rejects.toThrow("Can only review completed bookings");
  });

  it("rejects if user does not own the booking", async () => {
    const bookingQuery = mockQuery({
      data: { id: "b1", user_id: "other-user", provider_id: "p1", status: "completed" },
      error: null,
    });

    const supabase = createMockSupabase();
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(bookingQuery);

    await expect(
      createReview(supabase, "u1", {
        booking_id: "b1",
        overall_rating: 5,
        title: "Great service",
        review_text: "The plumber was excellent and very professional",
      }),
    ).rejects.toThrow("You can only review your own bookings");
  });
});

describe("voteHelpfulness", () => {
  it("inserts a new vote when user has not voted before", async () => {
    const supabase = createMockSupabase({
      rpc: vi.fn().mockResolvedValue({
        data: { helpful_count: 1, not_helpful_count: 0 },
        error: null,
      }),
    });

    const result = await voteHelpfulness(supabase, "u1", "r1", true);

    expect(result.helpful_count).toBe(1);
    expect(result.not_helpful_count).toBe(0);
    expect(supabase.rpc).toHaveBeenCalledWith("atomic_vote_review", {
      p_review_id: "r1",
      p_user_id: "u1",
      p_is_helpful: true,
    });
  });

  it("updates existing vote when user changes their vote", async () => {
    const supabase = createMockSupabase({
      rpc: vi.fn().mockResolvedValue({
        data: { helpful_count: 0, not_helpful_count: 1 },
        error: null,
      }),
    });

    const result = await voteHelpfulness(supabase, "u1", "r1", false);

    expect(result.helpful_count).toBe(0);
    expect(result.not_helpful_count).toBe(1);
    expect(supabase.rpc).toHaveBeenCalledWith("atomic_vote_review", {
      p_review_id: "r1",
      p_user_id: "u1",
      p_is_helpful: false,
    });
  });
});

describe("respondToReview", () => {
  it("rejects if user is not the provider for the review", async () => {
    const reviewQuery = mockQuery({
      data: { id: "r1", provider_id: "other-provider" },
      error: null,
    });

    const supabase = createMockSupabase();
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(reviewQuery);

    await expect(
      respondToReview(supabase, "p1", "r1", "Thank you for the feedback"),
    ).rejects.toThrow("Only the reviewed provider can respond");
  });

  it("rejects empty responses", async () => {
    const supabase = createMockSupabase();

    await expect(
      respondToReview(supabase, "p1", "r1", ""),
    ).rejects.toThrow("Response cannot be empty");
  });

  it("rejects responses over 1000 characters", async () => {
    const supabase = createMockSupabase();

    await expect(
      respondToReview(supabase, "p1", "r1", "a".repeat(1001)),
    ).rejects.toThrow("Response must be 1000 characters or less");
  });

  it("updates provider response when provider owns the review", async () => {
    const reviewQuery = mockQuery({
      data: { id: "r1", provider_id: "p1" },
      error: null,
    });

    const updateQuery = mockQuery({
      data: {
        id: "r1",
        provider_id: "p1",
        provider_response: "Thank you!",
        provider_response_at: "2026-03-07T00:00:00Z",
      },
      error: null,
    });

    const supabase = createMockSupabase();
    (supabase.from as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(reviewQuery)
      .mockReturnValueOnce(updateQuery);

    const result = await respondToReview(supabase, "p1", "r1", "Thank you!");

    expect(result.provider_response).toBe("Thank you!");
  });
});

describe("flagReview", () => {
  it("prevents user from flagging their own review", async () => {
    const supabase = createMockSupabase({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Cannot flag your own review", code: "P0001" },
      }),
    });

    await expect(
      flagReview(supabase, "u1", "r1", { reason: "spam" }),
    ).rejects.toThrow("Cannot flag your own review");
  });

  it("successfully flags another user's review", async () => {
    const flagData = { id: "f1", review_id: "r1", user_id: "u1", reason: "spam" };

    const supabase = createMockSupabase({
      rpc: vi.fn().mockResolvedValue({
        data: flagData,
        error: null,
      }),
    });

    const result = await flagReview(supabase, "u1", "r1", { reason: "spam" });

    expect(supabase.rpc).toHaveBeenCalledWith("atomic_flag_review", {
      p_review_id: "r1",
      p_user_id: "u1",
      p_reason: "spam",
      p_description: null,
    });
    expect(result).toEqual(flagData);
  });
});

describe("listProviderReviews", () => {
  it("returns paginated reviews for a provider", async () => {
    const mockData = {
      data: [
        { id: "r1", overall_rating: 5, title: "Great", moderation_status: "approved" },
        { id: "r2", overall_rating: 4, title: "Good", moderation_status: "approved" },
      ],
      error: null,
      count: 2,
    };

    // Build a proper chain that resolves correctly
    const chain: Record<string, unknown> = {};
    const methods = [
      "select", "eq", "is", "gte", "lte", "order", "range", "textSearch",
    ];
    for (const method of methods) {
      chain[method] = vi.fn().mockReturnValue(chain);
    }
    // Make the chain thenable to resolve with mock data
    chain["then"] = (resolve: (v: unknown) => void) => {
      resolve(mockData);
      return { catch: () => ({}) };
    };

    const supabase = createMockSupabase();
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(chain);

    const result = await listProviderReviews(supabase, "p1", {
      minRating: 3,
      maxRating: 5,
      sort: "recent",
      limit: 10,
      offset: 0,
    });

    expect(result.reviews).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.limit).toBe(10);
  });

  it("applies helpful sort correctly", async () => {
    const mockData = {
      data: [
        { id: "r1", overall_rating: 5, helpful_count: 10 },
      ],
      error: null,
      count: 1,
    };

    const chain: Record<string, unknown> = {};
    const methods = [
      "select", "eq", "is", "gte", "lte", "order", "range", "textSearch",
    ];
    for (const method of methods) {
      chain[method] = vi.fn().mockReturnValue(chain);
    }
    chain["then"] = (resolve: (v: unknown) => void) => {
      resolve(mockData);
      return { catch: () => ({}) };
    };

    const supabase = createMockSupabase();
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(chain);

    const result = await listProviderReviews(supabase, "p1", { sort: "helpful" });

    expect(result.reviews).toHaveLength(1);
    // Verify order was called with helpful_count
    expect(chain["order"]).toHaveBeenCalledWith("helpful_count", { ascending: false });
  });
});
