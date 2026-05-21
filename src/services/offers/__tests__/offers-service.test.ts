import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Hoist the captureException mock so we can verify the Stream-E migration
 * (console.error → captureException) is wired correctly. The offers-service
 * imports captureException from "@/lib/observability/capture-exception".
 */
const { captureExceptionMock } = vi.hoisted(() => ({
  captureExceptionMock: vi.fn(),
}));

vi.mock("@/lib/observability/capture-exception", () => ({
  captureException: captureExceptionMock,
  getErrorMessage: (err: unknown) =>
    err instanceof Error ? err.message : String(err),
}));

// ---------------------------------------------------------------------------
// Chainable query mock factory — modelled on review-service.test.ts
// ---------------------------------------------------------------------------

type QueryResult = { data: unknown; error: unknown };

function mockQuery(returnValue: QueryResult) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "select",
    "insert",
    "update",
    "upsert",
    "delete",
    "eq",
    "neq",
    "gte",
    "lte",
    "is",
    "in",
    "not",
    "limit",
    "order",
    "range",
    "single",
    "maybeSingle",
  ];

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  chain["single"] = vi.fn().mockResolvedValue(returnValue);
  chain["maybeSingle"] = vi.fn().mockResolvedValue(returnValue);

  // Make the chain thenable so awaits without single/maybeSingle still resolve.
  chain["then"] = (resolve: (v: unknown) => void) => {
    resolve(returnValue);
    return { catch: () => ({}) };
  };

  return chain;
}

function createMockSupabase(): SupabaseClient {
  return {
    from: vi.fn().mockReturnValue(mockQuery({ data: null, error: null })),
    rpc: vi.fn(),
  } as unknown as SupabaseClient;
}

beforeEach(() => {
  captureExceptionMock.mockReset();
});

// ---------------------------------------------------------------------------
// getOffers
// ---------------------------------------------------------------------------

describe("getOffers", () => {
  it("returns mapped buyer offers with property_address resolved from listings", async () => {
    // Arrange
    const offersRows = [
      {
        id: "o1",
        listing_id: "l1",
        amount: 250_000_00, // pence
        status: "submitted",
        conditions: null,
        aip_document_path: null,
        created_at: "2026-05-01T00:00:00Z",
        updated_at: "2026-05-01T00:00:00Z",
        offer_status_history: [
          {
            id: "h1",
            from_status: null,
            to_status: "submitted",
            notes: null,
            created_at: "2026-05-01T00:00:00Z",
          },
        ],
      },
    ];

    const offersQuery = mockQuery({ data: offersRows, error: null });
    const listingsQuery = mockQuery({
      data: [{ id: "l1", address: "10 Downing Street, London" }],
      error: null,
    });

    const supabase = createMockSupabase();
    (supabase.from as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(offersQuery)
      .mockReturnValueOnce(listingsQuery);

    // Act
    const { getOffers } = await import("../offers-service");
    const result = await getOffers(supabase, "user-1");

    // Assert
    expect(Array.isArray(result)).toBe(true);
    const offers = result as Array<{
      id: string;
      property_address: string;
      amount_pence: number;
    }>;
    expect(offers).toHaveLength(1);
    expect(offers[0].id).toBe("o1");
    expect(offers[0].property_address).toBe("10 Downing Street, London");
    expect(offers[0].amount_pence).toBe(25_000_000);
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("captures exception and returns ServiceError when the offers query errors", async () => {
    // Arrange
    const dbError = { message: "permission denied for table offers" };
    const offersQuery = mockQuery({ data: null, error: dbError });

    const supabase = createMockSupabase();
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(offersQuery);

    // Act
    const { getOffers } = await import("../offers-service");
    const result = await getOffers(supabase, "user-1");

    // Assert
    expect(result).toEqual({ error: "permission denied for table offers" });
    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    expect(captureExceptionMock).toHaveBeenCalledWith(
      dbError,
      expect.objectContaining({
        module: "transaction",
        feature: "offers-service",
        operation: "getOffers",
        extra: expect.objectContaining({ userId: "user-1" }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// submitOffer
// ---------------------------------------------------------------------------

describe("submitOffer", () => {
  it("inserts a new offer (GBP → pence) and returns the new offerId (happy path)", async () => {
    // Arrange — no existing open offer
    const duplicateCheck = mockQuery({ data: null, error: null });
    const insertQuery = mockQuery({ data: { id: "offer-new" }, error: null });

    const supabase = createMockSupabase();
    (supabase.from as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(duplicateCheck)
      .mockReturnValueOnce(insertQuery);

    // Act
    const { submitOffer } = await import("../offers-service");
    const result = await submitOffer(
      supabase,
      "user-1",
      "listing-1",
      250_000, // GBP
      "agent-1",
    );

    // Assert
    expect(result).toEqual({ offerId: "offer-new" });
    expect(captureExceptionMock).not.toHaveBeenCalled();
    // Verify insert was called with pence (250_000 GBP → 25_000_000 pence)
    expect(insertQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        listing_id: "listing-1",
        agent_id: "agent-1",
        amount: 25_000_000,
      }),
    );
  });

  it("returns DUPLICATE_OFFER when an open offer already exists on the listing", async () => {
    // Arrange — duplicate check returns an existing offer
    const duplicateCheck = mockQuery({
      data: { id: "existing-offer", status: "submitted" },
      error: null,
    });

    const supabase = createMockSupabase();
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(duplicateCheck);

    // Act
    const { submitOffer } = await import("../offers-service");
    const result = await submitOffer(supabase, "user-1", "listing-1", 250_000, "agent-1");

    // Assert
    expect(result).toEqual({ error: "DUPLICATE_OFFER" });
    // Duplicate is a business outcome — should NOT capture to Sentry
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("captures exception when the insert errors (e.g. DB constraint violation)", async () => {
    // Arrange — duplicate-check OK, but insert fails
    const duplicateCheck = mockQuery({ data: null, error: null });
    const insertError = { message: "duplicate key value violates unique constraint" };
    const insertQuery = mockQuery({ data: null, error: insertError });

    const supabase = createMockSupabase();
    (supabase.from as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(duplicateCheck)
      .mockReturnValueOnce(insertQuery);

    // Act
    const { submitOffer } = await import("../offers-service");
    const result = await submitOffer(supabase, "user-1", "listing-1", 250_000, "agent-1");

    // Assert
    expect(result).toEqual({ error: insertError.message });
    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    expect(captureExceptionMock).toHaveBeenCalledWith(
      insertError,
      expect.objectContaining({
        module: "transaction",
        feature: "offers-service",
        operation: "submitOffer.insert",
        extra: expect.objectContaining({ userId: "user-1", listingId: "listing-1" }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// withdrawOffer
// ---------------------------------------------------------------------------

describe("withdrawOffer", () => {
  it("returns null when the SECURITY DEFINER RPC reports success (owner withdraws)", async () => {
    // Arrange
    const rpcChain = {
      maybeSingle: vi.fn().mockResolvedValue({
        data: { success: true, code: "OK", message: "withdrawn" },
        error: null,
      }),
    };
    const supabase = createMockSupabase();
    (supabase.rpc as ReturnType<typeof vi.fn>).mockReturnValueOnce(rpcChain);

    // Act
    const { withdrawOffer } = await import("../offers-service");
    const result = await withdrawOffer(supabase, "user-1", "offer-1");

    // Assert
    expect(supabase.rpc).toHaveBeenCalledWith("withdraw_offer", { p_offer_id: "offer-1" });
    expect(result).toBeNull();
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("returns 401 ServiceError when the RPC reports UNAUTHORIZED (non-owner)", async () => {
    // Arrange — RLS/SECURITY DEFINER says the caller is not the offer owner
    const rpcChain = {
      maybeSingle: vi.fn().mockResolvedValue({
        data: { success: false, code: "UNAUTHORIZED", message: "not your offer" },
        error: null,
      }),
    };
    const supabase = createMockSupabase();
    (supabase.rpc as ReturnType<typeof vi.fn>).mockReturnValueOnce(rpcChain);

    // Act
    const { withdrawOffer } = await import("../offers-service");
    const result = await withdrawOffer(supabase, "other-user", "offer-1");

    // Assert
    expect(result).toEqual({ error: "not your offer", status: 401 });
    // Business-logic auth failure — should NOT capture to Sentry
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("captures exception when the RPC itself errors", async () => {
    // Arrange — RPC throws DB error
    const dbError = { message: "function withdraw_offer does not exist" };
    const rpcChain = {
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    };
    const supabase = createMockSupabase();
    (supabase.rpc as ReturnType<typeof vi.fn>).mockReturnValueOnce(rpcChain);

    // Act
    const { withdrawOffer } = await import("../offers-service");
    const result = await withdrawOffer(supabase, "user-1", "offer-1");

    // Assert
    expect(result).toEqual({ error: dbError.message });
    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    expect(captureExceptionMock).toHaveBeenCalledWith(
      dbError,
      expect.objectContaining({
        module: "transaction",
        feature: "offers",
        operation: "withdrawOffer",
        extra: expect.objectContaining({ offerId: "offer-1" }),
      }),
    );
  });
});
