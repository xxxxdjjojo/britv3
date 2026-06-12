/**
 * Tests for truedeed introduction-service (TDD RED — service not yet implemented)
 *
 * Pins the contract of @/services/truedeed/introduction-service:
 *  1. recordIntroduction({ applicantId, listingId, contactType })
 *     - resolves listing → agent_id (listings.user_id) + branch_id
 *     - inserts the ledger row with tail_expires_at = occurred_at + 6 months
 *       and applicant_name / applicant_email snapshots from profiles
 *     - inserts introduction_status_history 'active' + truedeed_audit_log row
 *     - emits Inngest "truedeed/introduction.recorded" with { introductionId }
 *     - returns { introductionId, created: true }
 *  2. Duplicate (unique violation 23505) → no throw; looks up the existing
 *     introduction, appends an introduction_events row, returns
 *     { created: false, introductionId: existing }
 *  3. Listing / applicant not found → null, no inngest send
 *  4. Any thrown supabase error → null (never throws)
 *  5. recordIntroductionEvent({ applicantId, listingId, eventType, payload? })
 *     - finds the introduction by (applicant, listing), inserts an event row
 *     - false when no introduction exists
 *
 * All test data is synthetic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/inngest/client", () => ({
  inngest: { send: vi.fn().mockResolvedValue(undefined) },
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { inngest } from "@/inngest/client";
import {
  recordIntroduction,
  recordIntroductionEvent,
} from "@/services/truedeed/introduction-service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const APPLICANT_ID = "aaaaaaaa-0000-4000-8000-000000000001";
const LISTING_ID = "bbbbbbbb-0000-4000-8000-000000000002";
const AGENT_ID = "cccccccc-0000-4000-8000-000000000003";
const BRANCH_ID = "dddddddd-0000-4000-8000-000000000004";
const INTRO_ID = "eeeeeeee-0000-4000-8000-000000000005";
const EXISTING_INTRO_ID = "ffffffff-0000-4000-8000-000000000006";

const NOW = new Date("2026-06-12T10:00:00.000Z");

type DbResult = { data: unknown; error: unknown };
const ok = (data: unknown = null): DbResult => ({ data, error: null });

/**
 * Chainable per-table Supabase mock (pattern from listings/create.test.ts).
 * Tracks whether the chain is in insert or select mode so the same table
 * can be configured with distinct results for each, and is awaitable both
 * via .single()/.maybeSingle() and directly (thenable).
 */
function createTableChain(results: { insert?: DbResult; select?: DbResult }) {
  let op: "insert" | "select" = "select";
  const resolveResult = () => results[op] ?? ok();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: any = {};
  for (const method of ["eq", "match", "order", "limit", "is"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.insert = vi.fn(() => {
    op = "insert";
    return chain;
  });
  chain.select = vi.fn(() => {
    // select() after insert() returns the inserted row — stay in insert mode
    if (op !== "insert") op = "select";
    return chain;
  });
  chain.single = vi.fn(() => Promise.resolve(resolveResult()));
  chain.maybeSingle = vi.fn(() => Promise.resolve(resolveResult()));
  chain.then = (
    onFulfilled?: (value: DbResult) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(resolveResult()).then(onFulfilled, onRejected);
  return chain;
}

function createSupabaseMock(overrides?: {
  listingSelect?: DbResult;
  profileSelect?: DbResult;
  introductionInsert?: DbResult;
  introductionSelect?: DbResult;
}) {
  const listings = createTableChain({
    select:
      overrides?.listingSelect ??
      ok({ id: LISTING_ID, user_id: AGENT_ID, branch_id: BRANCH_ID }),
  });
  const profiles = createTableChain({
    select:
      overrides?.profileSelect ??
      ok({
        id: APPLICANT_ID,
        display_name: "Jane Buyer",
      }),
  });
  const introductions = createTableChain({
    insert: overrides?.introductionInsert ?? ok({ id: INTRO_ID }),
    select: overrides?.introductionSelect ?? ok({ id: EXISTING_INTRO_ID }),
  });
  const statusHistory = createTableChain({ insert: ok() });
  const auditLog = createTableChain({ insert: ok() });
  const events = createTableChain({ insert: ok() });

  const from = vi.fn((table: string) => {
    switch (table) {
      case "listings":
        return listings;
      case "profiles":
        return profiles;
      case "introductions":
        return introductions;
      case "introduction_status_history":
        return statusHistory;
      case "truedeed_audit_log":
        return auditLog;
      case "introduction_events":
        return events;
      default:
        return createTableChain({});
    }
  });

  // The real profiles table has no email column — the service resolves the
  // applicant's email via the auth admin API (auth.users is the source of
  // truth for email).
  const getUserById = vi.fn().mockResolvedValue({
    data: { user: { id: APPLICANT_ID, email: "jane.buyer@example.com" } },
    error: null,
  });

  const supabase = {
    from,
    rpc: vi.fn().mockResolvedValue(ok()),
    auth: { admin: { getUserById } },
  };
  return {
    supabase, from, listings, profiles, introductions, statusHistory,
    auditLog, events, getUserById,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  vi.mocked(inngest.send).mockResolvedValue(undefined as never);
});

afterEach(() => {
  vi.useRealTimers();
});

function arm(mock: ReturnType<typeof createSupabaseMock>) {
  vi.mocked(createAdminClient).mockReturnValue(mock.supabase as never);
  return mock;
}

// ---------------------------------------------------------------------------
// 1. recordIntroduction — happy path
// ---------------------------------------------------------------------------

describe("recordIntroduction — happy path", () => {
  it("resolves the listing to agent_id (listings.user_id) and branch_id", async () => {
    const { listings, introductions } = arm(createSupabaseMock());

    await recordIntroduction({
      applicantId: APPLICANT_ID,
      listingId: LISTING_ID,
      contactType: "enquiry",
    });

    expect(listings.eq).toHaveBeenCalledWith("id", LISTING_ID);
    expect(introductions.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        applicant_id: APPLICANT_ID,
        listing_id: LISTING_ID,
        agent_id: AGENT_ID,
        branch_id: BRANCH_ID,
        first_contact_type: "enquiry",
      }),
    );
  });

  it("sets tail_expires_at = occurred_at + 6 months and snapshots applicant name/email from profiles", async () => {
    const { introductions } = arm(createSupabaseMock());

    await recordIntroduction({
      applicantId: APPLICANT_ID,
      listingId: LISTING_ID,
      contactType: "enquiry",
    });

    expect(introductions.insert).toHaveBeenCalledTimes(1);
    const inserted = introductions.insert.mock.calls[0][0] as Record<string, unknown>;

    expect(inserted).toMatchObject({
      applicant_name: "Jane Buyer",
      applicant_email: "jane.buyer@example.com",
    });

    // occurred_at is "now" (system time frozen at NOW); tail = +6 calendar months
    expect(new Date(String(inserted.occurred_at)).toISOString()).toBe(
      "2026-06-12T10:00:00.000Z",
    );
    expect(new Date(String(inserted.tail_expires_at)).toISOString()).toBe(
      "2026-12-12T10:00:00.000Z",
    );
  });

  it("inserts status_history 'active' and a truedeed_audit_log row", async () => {
    const { statusHistory, auditLog } = arm(createSupabaseMock());

    await recordIntroduction({
      applicantId: APPLICANT_ID,
      listingId: LISTING_ID,
      contactType: "enquiry",
    });

    expect(statusHistory.insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "active" }),
    );
    expect(auditLog.insert).toHaveBeenCalledTimes(1);
  });

  it("sends inngest 'truedeed/introduction.recorded' with the introductionId and returns { created: true }", async () => {
    arm(createSupabaseMock());

    const result = await recordIntroduction({
      applicantId: APPLICANT_ID,
      listingId: LISTING_ID,
      contactType: "enquiry",
    });

    expect(inngest.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "truedeed/introduction.recorded",
        data: expect.objectContaining({ introductionId: INTRO_ID }),
      }),
    );
    expect(result).toEqual({ introductionId: INTRO_ID, created: true });
  });
});

// ---------------------------------------------------------------------------
// 2. recordIntroduction — duplicate (idempotency)
// ---------------------------------------------------------------------------

describe("recordIntroduction — duplicate (unique violation 23505)", () => {
  it("does not throw; appends an introduction_events row for the existing introduction and returns { created: false }", async () => {
    const { events } = arm(
      createSupabaseMock({
        introductionInsert: {
          data: null,
          error: {
            code: "23505",
            message:
              'duplicate key value violates unique constraint "introductions_applicant_listing_key"',
          },
        },
        introductionSelect: ok({ id: EXISTING_INTRO_ID }),
      }),
    );

    const result = await recordIntroduction({
      applicantId: APPLICANT_ID,
      listingId: LISTING_ID,
      contactType: "viewing_request",
    });

    expect(result).toEqual({
      introductionId: EXISTING_INTRO_ID,
      created: false,
    });
    expect(events.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        introduction_id: EXISTING_INTRO_ID,
        event_type: expect.any(String),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// 3. recordIntroduction — not found / errors
// ---------------------------------------------------------------------------

describe("recordIntroduction — not found and error paths", () => {
  it("returns null and sends no inngest event when the listing is not found", async () => {
    arm(createSupabaseMock({ listingSelect: ok(null) }));

    const result = await recordIntroduction({
      applicantId: APPLICANT_ID,
      listingId: LISTING_ID,
      contactType: "enquiry",
    });

    expect(result).toBeNull();
    expect(inngest.send).not.toHaveBeenCalled();
  });

  it("returns null and sends no inngest event when the applicant profile is not found", async () => {
    arm(createSupabaseMock({ profileSelect: ok(null) }));

    const result = await recordIntroduction({
      applicantId: APPLICANT_ID,
      listingId: LISTING_ID,
      contactType: "enquiry",
    });

    expect(result).toBeNull();
    expect(inngest.send).not.toHaveBeenCalled();
  });

  it("returns null (never throws) when supabase throws", async () => {
    const mock = arm(createSupabaseMock());
    mock.from.mockImplementation(() => {
      throw new Error("connection reset");
    });

    await expect(
      recordIntroduction({
        applicantId: APPLICANT_ID,
        listingId: LISTING_ID,
        contactType: "enquiry",
      }),
    ).resolves.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. recordIntroductionEvent
// ---------------------------------------------------------------------------

describe("recordIntroductionEvent", () => {
  it("finds the introduction by (applicant, listing) and inserts an event row → true", async () => {
    const { events } = arm(
      createSupabaseMock({ introductionSelect: ok({ id: EXISTING_INTRO_ID }) }),
    );

    const result = await recordIntroductionEvent({
      applicantId: APPLICANT_ID,
      listingId: LISTING_ID,
      eventType: "viewing_booked",
      payload: { viewing_id: "11111111-0000-4000-8000-000000000007" },
    });

    expect(result).toBe(true);
    expect(events.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        introduction_id: EXISTING_INTRO_ID,
        event_type: "viewing_booked",
      }),
    );
  });

  it("returns false and inserts nothing when no introduction exists", async () => {
    const { events } = arm(
      createSupabaseMock({ introductionSelect: ok(null) }),
    );

    const result = await recordIntroductionEvent({
      applicantId: APPLICANT_ID,
      listingId: LISTING_ID,
      eventType: "message_sent",
    });

    expect(result).toBe(false);
    expect(events.insert).not.toHaveBeenCalled();
  });
});
