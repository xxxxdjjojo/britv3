import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createReview,
  editReview,
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
    // First call: check existing vote (none found)
    const existingQuery = mockQuery({ data: null, error: null });
    // Second call: insert new vote
    const insertQuery = mockQuery({ data: { id: "vh1" }, error: null });
    // Third call: read review counts for increment
    const reviewReadQuery = mockQuery({
      data: { helpful_count: 0, not_helpful_count: 0 },
      error: null,
    });
    // Fourth call: update review counts
    const reviewUpdateChain = mockQuery({ data: null, error: null });
    // Fifth call: get updated counts
    const updatedQuery = mockQuery({
      data: { helpful_count: 1, not_helpful_count: 0 },
      error: null,
    });

    const supabase = createMockSupabase();
    (supabase.from as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(existingQuery)
      .mockReturnValueOnce(insertQuery)
      .mockReturnValueOnce(reviewReadQuery)
      .mockReturnValueOnce(reviewUpdateChain)
      .mockReturnValueOnce(updatedQuery);

    const result = await voteHelpfulness(supabase, "u1", "r1", true);

    expect(result.helpful_count).toBe(1);
    expect(result.not_helpful_count).toBe(0);
  });

  it("updates existing vote when user changes their vote", async () => {
    // First call: find existing vote
    const existingQuery = mockQuery({
      data: { id: "vh1", is_helpful: true },
      error: null,
    });
    // Second call: update vote
    const updateQuery = mockQuery({ data: null, error: null });
    // Third call: read review counts
    const reviewReadQuery = mockQuery({
      data: { helpful_count: 1, not_helpful_count: 0 },
      error: null,
    });
    // Fourth call: update review counts
    const reviewUpdateChain = mockQuery({ data: null, error: null });
    // Fifth call: get updated counts
    const updatedQuery = mockQuery({
      data: { helpful_count: 0, not_helpful_count: 1 },
      error: null,
    });

    const supabase = createMockSupabase();
    (supabase.from as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(existingQuery)
      .mockReturnValueOnce(updateQuery)
      .mockReturnValueOnce(reviewReadQuery)
      .mockReturnValueOnce(reviewUpdateChain)
      .mockReturnValueOnce(updatedQuery);

    const result = await voteHelpfulness(supabase, "u1", "r1", false);

    expect(result.helpful_count).toBe(0);
    expect(result.not_helpful_count).toBe(1);
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
    const reviewQuery = mockQuery({
      data: { id: "r1", reviewer_id: "u1", flag_count: 0 },
      error: null,
    });

    const supabase = createMockSupabase();
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(reviewQuery);

    await expect(
      flagReview(supabase, "u1", "r1", { reason: "spam" }),
    ).rejects.toThrow("Cannot flag your own review");
  });

  it("successfully flags another user's review", async () => {
    const reviewQuery = mockQuery({
      data: { id: "r1", reviewer_id: "other-user", flag_count: 0 },
      error: null,
    });

    const flagInsert = mockQuery({
      data: { id: "f1", review_id: "r1", user_id: "u1", reason: "spam" },
      error: null,
    });

    const reviewUpdate = mockQuery({ data: null, error: null });

    const supabase = createMockSupabase();
    (supabase.from as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(reviewQuery)
      .mockReturnValueOnce(flagInsert)
      .mockReturnValueOnce(reviewUpdate);

    const result = await flagReview(supabase, "u1", "r1", { reason: "spam" });

    expect(result.reason).toBe("spam");
  });
});

describe("editReview", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const validEditInput = {
    title: "Updated review title",
    review_text: "Updated review text that is at least twenty characters long",
    overall_rating: 4,
  };

  it("successfully edits a review within the 48h window", async () => {
    // Review created 1 hour ago — well within window
    const recentCreatedAt = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();

    const fetchQuery = mockQuery({
      data: {
        id: "r1",
        reviewer_id: "u1",
        review_text: "Original review text that is long enough",
        title: "Original title",
        created_at: recentCreatedAt,
        edit_count: 0,
        edit_history: [],
        original_text: null,
      },
      error: null,
    });

    const updateQuery = mockQuery({
      data: {
        id: "r1",
        reviewer_id: "u1",
        title: "Updated review title",
        review_text: "Updated review text that is at least twenty characters long",
        overall_rating: 4,
        edit_count: 1,
        moderation_status: "pending",
        original_text: "Original review text that is long enough",
      },
      error: null,
    });

    const upsertQuery = mockQuery({ data: null, error: null });

    const supabase = createMockSupabase();
    const fromMock = supabase.from as ReturnType<typeof vi.fn>;
    fromMock
      .mockReturnValueOnce(fetchQuery)   // reviews select
      .mockReturnValueOnce(updateQuery)  // reviews update
      .mockReturnValueOnce(upsertQuery); // moderation_queue upsert

    const result = await editReview(supabase, "u1", "r1", validEditInput);

    expect(result).toBeDefined();
    expect(result.edit_count).toBe(1);
    expect(result.moderation_status).toBe("pending");
    expect(result.original_text).toBe("Original review text that is long enough");
  });

  it("rejects edit when the 48h window has expired", async () => {
    // Review created 49 hours ago — outside the window
    const expiredCreatedAt = new Date(Date.now() - 49 * 60 * 60 * 1000).toISOString();

    const fetchQuery = mockQuery({
      data: {
        id: "r1",
        reviewer_id: "u1",
        review_text: "Original review text that is long enough",
        title: "Original title",
        created_at: expiredCreatedAt,
        edit_count: 0,
        edit_history: [],
        original_text: null,
      },
      error: null,
    });

    const supabase = createMockSupabase();
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(fetchQuery);

    await expect(
      editReview(supabase, "u1", "r1", validEditInput),
    ).rejects.toThrow("Edit window has expired");
  });

  it("rejects edit when max edits (2) have already been made", async () => {
    // Review created 1 hour ago but already has 2 edits
    const recentCreatedAt = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();

    const fetchQuery = mockQuery({
      data: {
        id: "r1",
        reviewer_id: "u1",
        review_text: "Twice-edited review text that is long enough",
        title: "Twice-edited title",
        created_at: recentCreatedAt,
        edit_count: 2,
        edit_history: [
          { text: "First version", title: "First title", edited_at: "2026-01-01T00:00:00Z" },
          { text: "Second version", title: "Second title", edited_at: "2026-01-01T01:00:00Z" },
        ],
        original_text: "Original review text that is long enough",
      },
      error: null,
    });

    const supabase = createMockSupabase();
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(fetchQuery);

    await expect(
      editReview(supabase, "u1", "r1", validEditInput),
    ).rejects.toThrow("Maximum number of edits (2) reached");
  });

  it("rejects edit when user is not the review author", async () => {
    const recentCreatedAt = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();

    const fetchQuery = mockQuery({
      data: {
        id: "r1",
        reviewer_id: "other-user",
        review_text: "Another user's review text that is long enough",
        title: "Another user's title",
        created_at: recentCreatedAt,
        edit_count: 0,
        edit_history: [],
        original_text: null,
      },
      error: null,
    });

    const supabase = createMockSupabase();
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(fetchQuery);

    await expect(
      editReview(supabase, "u1", "r1", validEditInput),
    ).rejects.toThrow("You can only edit your own reviews");
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
