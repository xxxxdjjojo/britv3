import { describe, it, expect, vi, beforeEach } from "vitest";

const emailMocks = vi.hoisted(() => ({
  sendVerification: vi.fn(async (_params: unknown) => {}),
  sendPasswordReset: vi.fn(async (_params: unknown) => {}),
}));
const inngestMocks = vi.hoisted(() => ({ send: vi.fn(async (_event: unknown) => ({ ids: ["x"] })) }));

vi.mock("@/services/email/email-service", () => ({
  sendVerification: emailMocks.sendVerification,
  sendPasswordReset: emailMocks.sendPasswordReset,
}));
vi.mock("@/inngest/client", () => ({ inngest: { send: inngestMocks.send } }));

import { TIER1_ACTIONS, getTier1Action, actionsForTarget } from "./registry";
import { Tier1ActionError, type Tier1ActionContext } from "./types";
import { ADMIN_ROLES, hasPermission } from "@/lib/admin-permissions";

// ── Test doubles ─────────────────────────────────────────────────────────────

type QueryResult = { data: unknown; error: unknown };

/** Minimal chainable Supabase stub: from(table).select().eq().maybeSingle() and upsert(). */
function makeSupabase(opts: {
  tables?: Record<string, QueryResult>;
  getUserById?: QueryResult;
  generateLink?: QueryResult;
  upsert?: { error: unknown };
}) {
  const upsertSpy = vi.fn(async (_row: unknown) => opts.upsert ?? { error: null });
  return {
    _upsertSpy: upsertSpy,
    from(table: string) {
      const result = opts.tables?.[table] ?? { data: null, error: null };
      const builder: Record<string, unknown> = {
        select: () => builder,
        eq: () => builder,
        maybeSingle: async () => result,
        upsert: upsertSpy,
      };
      return builder;
    },
    auth: {
      admin: {
        getUserById: vi.fn(async () => opts.getUserById ?? { data: null, error: null }),
        generateLink: vi.fn(async () => opts.generateLink ?? { data: null, error: null }),
      },
    },
  };
}

function ctxOf(
  supabase: ReturnType<typeof makeSupabase>,
  targetId: string,
  stripe?: unknown,
): Tier1ActionContext {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test double
    supabase: supabase as any,
    getStripe: () => (stripe ?? {}) as never,
    targetId,
    actorId: "admin-1",
  };
}

beforeEach(() => {
  emailMocks.sendVerification.mockClear();
  emailMocks.sendPasswordReset.mockClear();
  inngestMocks.send.mockClear();
});

// ── Registry contract ────────────────────────────────────────────────────────

describe("tier1 registry contract", () => {
  it("every action declares a permission, target type, preview and execute", () => {
    for (const action of Object.values(TIER1_ACTIONS)) {
      expect(action.key).toBeTruthy();
      expect(action.requiredPermission).toBeTruthy();
      expect(["user", "billing_event"]).toContain(action.targetType);
      expect(typeof action.preview).toBe("function");
      expect(typeof action.execute).toBe("function");
    }
  });

  it("keys are unique and match the map key", () => {
    for (const [key, action] of Object.entries(TIER1_ACTIONS)) {
      expect(action.key).toBe(key);
    }
  });

  it("every requiredPermission is held by at least one admin role", () => {
    for (const action of Object.values(TIER1_ACTIONS)) {
      const someoneHasIt = ADMIN_ROLES.some((r) => hasPermission(r, action.requiredPermission));
      expect(someoneHasIt).toBe(true);
    }
  });

  it("the reset-link action is high-risk, super_admin-only, and needs approval", async () => {
    const action = getTier1Action("regenerate-reset-link");
    expect(action).toBeDefined();
    expect(action?.risk).toBe("high");
    expect(action?.requiredPermission).toBe("manage_credentials");
    expect(hasPermission("ops_admin", "manage_credentials")).toBe(false);
  });

  it("actionsForTarget filters by target type", () => {
    expect(actionsForTarget("billing_event").every((a) => a.targetType === "billing_event")).toBe(true);
    expect(actionsForTarget("user").length).toBeGreaterThan(0);
  });

  it("getTier1Action returns undefined for an unknown key", () => {
    expect(getTier1Action("nope")).toBeUndefined();
  });
});

// ── resend-verification-email ────────────────────────────────────────────────

describe("resend-verification-email", () => {
  const action = getTier1Action("resend-verification-email")!;

  it("preview flags an already-verified user as blocked", async () => {
    const supabase = makeSupabase({
      getUserById: {
        data: { user: { id: "u1", email: "a@b.com", email_confirmed_at: "2026-01-01" } },
        error: null,
      },
    });
    const preview = await action.preview(ctxOf(supabase, "u1"));
    expect(preview.blockers).toContain("Email is already verified.");
  });

  it("execute generates a link and emails it; never returns the link", async () => {
    const supabase = makeSupabase({
      getUserById: {
        data: { user: { id: "u1", email: "a@b.com", email_confirmed_at: null, user_metadata: { first_name: "Sam" } } },
        error: null,
      },
      generateLink: { data: { properties: { action_link: "https://secret-link" } }, error: null },
    });
    const result = await action.execute(ctxOf(supabase, "u1"));
    expect(emailMocks.sendVerification).toHaveBeenCalledOnce();
    expect(emailMocks.sendVerification.mock.calls[0][0]).toMatchObject({
      email: "a@b.com",
      verificationUrl: "https://secret-link",
    });
    expect(JSON.stringify(result)).not.toContain("secret-link");
  });

  it("execute refuses an already-verified user", async () => {
    const supabase = makeSupabase({
      getUserById: { data: { user: { id: "u1", email: "a@b.com", email_confirmed_at: "2026-01-01" } }, error: null },
    });
    await expect(action.execute(ctxOf(supabase, "u1"))).rejects.toBeInstanceOf(Tier1ActionError);
  });

  it("execute throws 404 when the user does not exist", async () => {
    const supabase = makeSupabase({ getUserById: { data: null, error: { message: "nope" } } });
    await expect(action.execute(ctxOf(supabase, "u1"))).rejects.toMatchObject({ status: 404 });
  });
});

// ── regenerate-reset-link (security-critical) ────────────────────────────────

describe("regenerate-reset-link", () => {
  const action = getTier1Action("regenerate-reset-link")!;

  it("emails the reset link and NEVER returns or exposes it", async () => {
    const supabase = makeSupabase({
      getUserById: { data: { user: { id: "u1", email: "a@b.com", user_metadata: { first_name: "Sam" } } }, error: null },
      generateLink: { data: { properties: { action_link: "https://reset-secret-token" } }, error: null },
    });
    const result = await action.execute(ctxOf(supabase, "u1"));
    expect(emailMocks.sendPasswordReset).toHaveBeenCalledOnce();
    expect(emailMocks.sendPasswordReset.mock.calls[0][0]).toMatchObject({
      email: "a@b.com",
      resetUrl: "https://reset-secret-token",
    });
    // The link must not leak through the action result under any key.
    expect(JSON.stringify(result)).not.toContain("reset-secret-token");
    expect(JSON.stringify(result)).not.toContain("token");
  });

  it("preview requires approval and is marked non-reversible", async () => {
    const supabase = makeSupabase({
      getUserById: { data: { user: { id: "u1", email: "a@b.com" } }, error: null },
    });
    const preview = await action.preview(ctxOf(supabase, "u1"));
    expect(preview.requiresApproval).toBe(true);
    expect(preview.reversible).toBe(false);
  });
});

// ── replay-dlq-webhook ───────────────────────────────────────────────────────

describe("replay-dlq-webhook", () => {
  const action = getTier1Action("replay-dlq-webhook")!;

  it("emits the DLQ event for a stored billing event", async () => {
    const supabase = makeSupabase({
      tables: {
        billing_events: {
          data: { stripe_event_id: "evt_1", event_type: "invoice.paid", payload: { a: 1 } },
          error: null,
        },
      },
    });
    const result = await action.execute(ctxOf(supabase, "evt_1"));
    expect(inngestMocks.send).toHaveBeenCalledOnce();
    expect(inngestMocks.send.mock.calls[0][0]).toMatchObject({
      name: "billing/webhook.handler_failed",
      data: { eventId: "evt_1", eventType: "invoice.paid", account: null },
    });
    expect(result.summary).toContain("evt_1");
  });

  it("preview warns about Connect events", async () => {
    const supabase = makeSupabase({
      tables: {
        billing_events: { data: { stripe_event_id: "evt_2", event_type: "payout.paid", payload: {} }, error: null },
      },
    });
    const preview = await action.preview(ctxOf(supabase, "evt_2"));
    expect(preview.blockers?.some((b) => b.includes("Connect"))).toBe(true);
  });

  it("execute throws 404 for a missing event", async () => {
    const supabase = makeSupabase({ tables: { billing_events: { data: null, error: null } } });
    await expect(action.execute(ctxOf(supabase, "evt_x"))).rejects.toMatchObject({ status: 404 });
  });
});

// ── restore-entitlement-from-stripe ──────────────────────────────────────────

describe("restore-entitlement-from-stripe", () => {
  const action = getTier1Action("restore-entitlement-from-stripe")!;

  function stripeWith(sub: unknown) {
    return { subscriptions: { list: vi.fn(async () => ({ data: sub ? [sub] : [] })) } };
  }

  it("reconciles the subscription row from live Stripe", async () => {
    const supabase = makeSupabase({
      tables: { subscriptions: { data: { stripe_customer_id: "cus_1" }, error: null } },
    });
    const stripe = stripeWith({
      id: "sub_1",
      status: "active",
      cancel_at_period_end: false,
      items: { data: [{ price: { id: "price_1", nickname: null, unit_amount: 999, currency: "gbp" }, current_period_end: 1893456000 }] },
    });
    const result = await action.execute(ctxOf(supabase, "u1", stripe));
    expect(supabase._upsertSpy).toHaveBeenCalledOnce();
    expect(supabase._upsertSpy.mock.calls[0][0]).toMatchObject({
      user_id: "u1",
      stripe_subscription_id: "sub_1",
      status: "active",
    });
    expect(result.summary).toContain("active");
  });

  it("throws 422 when no Stripe customer is linked", async () => {
    const supabase = makeSupabase({
      tables: { subscriptions: { data: null, error: null }, profiles: { data: null, error: null } },
    });
    await expect(action.execute(ctxOf(supabase, "u1", stripeWith(null)))).rejects.toMatchObject({ status: 422 });
  });

  it("throws 404 when the customer has no Stripe subscription", async () => {
    const supabase = makeSupabase({
      tables: { subscriptions: { data: { stripe_customer_id: "cus_1" }, error: null } },
    });
    await expect(action.execute(ctxOf(supabase, "u1", stripeWith(null)))).rejects.toMatchObject({ status: 404 });
  });
});
