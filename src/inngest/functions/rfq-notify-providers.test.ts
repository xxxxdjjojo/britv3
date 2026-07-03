import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/marketplace/rfq-service", () => ({
  matchProvidersForRfq: vi.fn(),
}));

vi.mock("@/services/notifications/email-service", () => ({
  sendProviderRfqEmail: vi.fn(),
}));

const adminClient = { placeholder: true };
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => adminClient),
}));

import { matchProvidersForRfq } from "@/services/marketplace/rfq-service";
import { sendProviderRfqEmail } from "@/services/notifications/email-service";
import { rfqNotifyProviders } from "./rfq-notify-providers";

const mockMatch = vi.mocked(matchProvidersForRfq);
const mockEmail = vi.mocked(sendProviderRfqEmail);

type Handler = (ctx: { event: unknown; step: unknown }) => Promise<unknown>;
const handler = (rfqNotifyProviders as unknown as { fn: Handler }).fn;

/** Minimal step harness: runs step.run callbacks immediately, records sleeps. */
function makeStep() {
  return {
    run: vi.fn(async (_id: string, fn: () => Promise<unknown>) => fn()),
    sleep: vi.fn(async () => undefined),
  };
}

type TableRows = Record<string, unknown>;

/**
 * Per-table chainable supabase mock. `single` resolves rows[table],
 * inserts are recorded per table, list-selects resolve rows[`${table}:list`].
 */
function makeSupabase(rows: Record<string, TableRows | TableRows[] | null>) {
  const inserts: Record<string, TableRows[]> = {};
  const from = vi.fn((table: string) => {
    const chain: Record<string, unknown> = {};
    for (const m of ["select", "eq", "in", "limit"]) {
      chain[m] = vi.fn(() => chain);
    }
    chain.single = vi.fn(async () => ({
      data: rows[table] ?? null,
      error: rows[table] ? null : { message: "not found" },
    }));
    chain.insert = vi.fn((row: TableRows) => {
      inserts[table] = [...(inserts[table] ?? []), row];
      const insertChain: Record<string, unknown> = {
        select: vi.fn(() => insertChain),
        single: vi.fn(async () => ({
          data: { id: `${table}-row-${inserts[table].length}` },
          error: null,
        })),
      };
      return insertChain;
    });
    // Awaiting the chain directly resolves the list variant (unread query).
    chain.then = (resolve: (v: unknown) => unknown) =>
      resolve({ data: rows[`${table}:list`] ?? [], error: null });
    return chain;
  });
  return { supabase: { from, auth: { admin: { listUsers: vi.fn() } } }, inserts, from };
}

const TARGET = {
  user_id: "target-provider-uuid",
  business_name: "Richards Plumbing & Heating",
  score: 100,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockEmail.mockResolvedValue({ sent: true });
});

describe("rfqNotifyProviders — direct (targeted) requests", () => {
  it("emails the target provider immediately and never sleeps", async () => {
    mockMatch.mockResolvedValue([TARGET]);
    const { supabase, inserts } = makeSupabase({
      service_requests: {
        title: "Plumber needed in W5 2AB",
        service_category: "plumber",
        target_provider_id: "target-provider-uuid",
      },
      profiles: { email: "tom.provider@demo.britestate.co.uk" },
    });
    const adminMock = await import("@/lib/supabase/admin");
    vi.mocked(adminMock.createAdminClient).mockReturnValue(
      supabase as never,
    );

    const step = makeStep();
    const result = await handler({
      event: { data: { rfqId: "rfq-1" } },
      step,
    });

    // In-app notification row written with direct-request copy
    expect(inserts["notifications"]).toHaveLength(1);
    expect(inserts["notifications"][0]).toMatchObject({
      user_id: "target-provider-uuid",
      type: "rfq_match",
    });
    expect(String(inserts["notifications"][0]["title"])).toMatch(/direct/i);

    // Immediate email, flagged direct — no 1h fallback wait
    expect(mockEmail).toHaveBeenCalledWith(
      "tom.provider@demo.britestate.co.uk",
      "Plumber needed in W5 2AB",
      true,
    );
    expect(step.sleep).not.toHaveBeenCalled();
    expect(result).toMatchObject({ status: "completed_direct" });
  });
});

describe("rfqNotifyProviders — broadcast requests", () => {
  it("creates in-app notifications, then falls back to email for unread after the wait", async () => {
    mockMatch.mockResolvedValue([
      { user_id: "prov-a", business_name: "A", score: 80 },
      { user_id: "prov-b", business_name: "B", score: 70 },
    ]);
    const { supabase, inserts } = makeSupabase({
      service_requests: {
        title: "Fix leaking tap",
        service_category: "plumber",
        target_provider_id: null,
      },
      "notifications:list": [{ user_id: "prov-a" }],
    });
    (supabase.auth.admin.listUsers as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        users: [
          { id: "prov-a", email: "a@example.com" },
          { id: "prov-b", email: "b@example.com" },
        ],
      },
    });
    const adminMock = await import("@/lib/supabase/admin");
    vi.mocked(adminMock.createAdminClient).mockReturnValue(
      supabase as never,
    );

    const step = makeStep();
    await handler({ event: { data: { rfqId: "rfq-2" } }, step });

    // In-app rows for both matched providers, broadcast copy
    expect(inserts["notifications"]).toHaveLength(2);
    expect(String(inserts["notifications"][0]["title"])).not.toMatch(/direct/i);

    // Waits, then emails only the still-unread provider, not flagged direct
    expect(step.sleep).toHaveBeenCalled();
    expect(mockEmail).toHaveBeenCalledTimes(1);
    expect(mockEmail).toHaveBeenCalledWith("a@example.com", "Fix leaking tap", false);
  });

  it("inserts notifications without a table-existence pre-check", async () => {
    mockMatch.mockResolvedValue([
      { user_id: "prov-a", business_name: "A", score: 80 },
    ]);
    const { supabase, from } = makeSupabase({
      service_requests: {
        title: "Fix leaking tap",
        service_category: "plumber",
        target_provider_id: null,
      },
    });
    (supabase.auth.admin.listUsers as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { users: [] },
    });
    const adminMock = await import("@/lib/supabase/admin");
    vi.mocked(adminMock.createAdminClient).mockReturnValue(
      supabase as never,
    );

    await handler({ event: { data: { rfqId: "rfq-3" } }, step: makeStep() });

    // Old code probed the table with .select("id").limit(0) before inserting
    // and bailed out entirely when the probe errored. The probe is gone:
    // every from("notifications") call must lead to an insert or the
    // unread-check, never a limit(0) probe.
    const notificationCalls = from.mock.results
      .map((r, i) => ({ chain: r.value, table: from.mock.calls[i][0] }))
      .filter((c) => c.table === "notifications");
    for (const call of notificationCalls) {
      expect(
        (call.chain.limit as ReturnType<typeof vi.fn>).mock.calls,
      ).toHaveLength(0);
    }
  });
});
