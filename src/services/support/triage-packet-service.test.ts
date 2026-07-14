import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const detailMocks = vi.hoisted(() => ({ getTicketDetail: vi.fn() }));
const diagMocks = vi.hoisted(() => ({ getDiagnostics: vi.fn() }));

vi.mock("@/services/admin/support-admin-service", () => ({
  getTicketDetail: detailMocks.getTicketDetail,
}));
vi.mock("@/services/admin/diagnostics-service", () => ({
  getDiagnostics: diagMocks.getDiagnostics,
}));

import {
  buildTriagePacketMarkdown,
  buildSentrySearchUrl,
  generateTriagePacket,
  type TriagePacketData,
} from "./triage-packet-service";

// A fixture packed with every PII class we must never leak into an LLM prompt.
const PII = {
  email: "sam.jones@example.com",
  name: "Samantha Jones",
  phone: "07911 123456",
  postcode: "SW1A 1AA",
  customerId: "cus_AB12cd34EF",
  body: "My card ending 4242 was double charged, I live at 10 Downing St SW1A 1AA, call 07911 123456",
};

function fullData(): TriagePacketData {
  return {
    ticket: {
      reference: "TD-7F3K9Q",
      subject: `Double charge — email ${PII.email}`,
      category: "payments",
      status: "open",
      priority: "high",
      createdAt: "2026-07-10T09:00:00Z",
      firstResponseAt: null,
      email: PII.email,
      name: PII.name,
      userId: "11111111-2222-3333-4444-555555555555",
      correlationId: "req-abc123def456",
    },
    messages: [
      { authorType: "customer", internalNote: false, body: PII.body, createdAt: "2026-07-10T09:00:00Z" },
      { authorType: "admin", internalNote: true, body: `chase ${PII.name} on ${PII.phone}`, createdAt: "2026-07-10T10:00:00Z" },
    ],
    emailLogs: [
      {
        template: "payment_failed",
        status: "suppressed",
        suppressionReason: `bounced for ${PII.email}`,
        errorMessage: `hard bounce ${PII.email}`,
        recipient: PII.email,
        createdAt: "2026-07-10T09:05:00Z",
      },
    ],
    billingEvents: [{ eventType: "invoice.payment_failed", processedAt: "2026-07-10T08:59:00Z" }],
    subscription: {
      status: "past_due",
      planName: "Landlord Plus",
      priceAmount: 2999,
      currency: "gbp",
      currentPeriodEnd: "2026-08-10T00:00:00Z",
      cancelAtPeriodEnd: false,
      stripeCustomerId: PII.customerId,
    },
    auditEntries: [
      { action: "tier1.replay-dlq-webhook", targetType: "billing_event", createdAt: "2026-07-10T11:00:00Z" },
    ],
    diagnostics: [
      { key: "billing.dlq_backlog", label: "Stripe DLQ backlog", level: "warn", value: 3, detail: "3 unprocessed" },
    ],
    recommendedActions: [
      { key: "restore-entitlement-from-stripe", label: "Restore entitlement", risk: "medium", reversible: true, requiresApproval: false },
    ],
    sentrySearchUrl: "https://acme.sentry.io/issues/?query=correlation_id%3Areq-abc123def456",
    playbookLinks: [{ label: "Payments playbooks", path: "docs/support/features/payments" }],
  };
}

describe("buildTriagePacketMarkdown — redaction guarantee", () => {
  it("emits markdown that contains NONE of the fixture PII", () => {
    const md = buildTriagePacketMarkdown(fullData());

    for (const secret of Object.values(PII)) {
      expect(md).not.toContain(secret);
    }
    // Free-text bodies must be stripped, not merely pattern-scrubbed.
    expect(md).not.toContain("double charged");
    expect(md).not.toContain("Downing");
    // Placeholders present.
    expect(md).toContain("[email]");
    expect(md).toContain("[free text redacted");
    // The full customer id never appears; last-4 handle does.
    expect(md).not.toContain("cus_AB12cd34EF");
    expect(md).toContain("cus_…34EF");
  });

  it("keeps safe diagnostic + structural signal", () => {
    const md = buildTriagePacketMarkdown(fullData());
    expect(md).toContain("TD-7F3K9Q");
    expect(md).toContain("payments");
    expect(md).toContain("past_due");
    expect(md).toContain("Stripe DLQ backlog");
    expect(md).toContain("invoice.payment_failed");
    expect(md).toContain("Restore entitlement");
    expect(md).toContain("acme.sentry.io"); // link only
  });

  it("never leaks the full internal user id (last-8 handle only)", () => {
    const md = buildTriagePacketMarkdown(fullData());
    expect(md).not.toContain("11111111-2222-3333-4444-555555555555");
    expect(md).toContain("55555555");
  });

  it("degrades gracefully for a guest ticket with no account data", () => {
    const data = fullData();
    const guest: TriagePacketData = {
      ...data,
      ticket: { ...data.ticket, userId: null, email: "guest@x.com", name: null, correlationId: null },
      emailLogs: [],
      billingEvents: [],
      subscription: null,
      auditEntries: [],
      recommendedActions: [],
      sentrySearchUrl: null,
    };
    const md = buildTriagePacketMarkdown(guest);
    expect(md).toContain("TD-7F3K9Q");
    expect(md).toContain("No linked account");
    expect(md).not.toContain("guest@x.com");
  });
});

describe("buildSentrySearchUrl", () => {
  const OLD_ORG = process.env.SENTRY_ORG_SLUG;
  const OLD_PROJECT = process.env.SENTRY_PROJECT_SLUG;

  beforeEach(() => {
    delete process.env.SENTRY_ORG_SLUG;
    delete process.env.SENTRY_PROJECT_SLUG;
  });

  afterEach(() => {
    if (OLD_ORG === undefined) delete process.env.SENTRY_ORG_SLUG;
    else process.env.SENTRY_ORG_SLUG = OLD_ORG;
    if (OLD_PROJECT === undefined) delete process.env.SENTRY_PROJECT_SLUG;
    else process.env.SENTRY_PROJECT_SLUG = OLD_PROJECT;
  });

  it("returns null without a correlation id", () => {
    process.env.SENTRY_ORG_SLUG = "acme";
    expect(buildSentrySearchUrl(null)).toBeNull();
  });

  it("returns null when the org slug is not configured", () => {
    expect(buildSentrySearchUrl("req-1")).toBeNull();
  });

  it("builds an issues search URL keyed by correlation id", () => {
    process.env.SENTRY_ORG_SLUG = "acme";
    const url = buildSentrySearchUrl("req-abc");
    expect(url).toContain("https://acme.sentry.io/issues/");
    expect(url).toContain("correlation_id%3Areq-abc");
  });
});

describe("generateTriagePacket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    diagMocks.getDiagnostics.mockResolvedValue([]);
  });

  it("throws when the ticket does not exist", async () => {
    detailMocks.getTicketDetail.mockResolvedValue(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test double
    await expect(generateTriagePacket({} as any, "missing")).rejects.toThrow(/not found/i);
  });

  it("builds a redacted packet for a guest ticket without touching account tables", async () => {
    detailMocks.getTicketDetail.mockResolvedValue({
      id: "t1",
      reference: "TD-GUEST1",
      subject: "help",
      category: "other",
      status: "open",
      priority: "normal",
      createdAt: "2026-07-10T09:00:00Z",
      firstResponseAt: null,
      email: "guest@example.com",
      name: null,
      userId: null,
      correlationId: null,
      messages: [{ authorType: "customer", body: "secret words", internalNote: false, createdAt: "2026-07-10T09:00:00Z" }],
    });

    const supabase = { from: vi.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test double
    const result = await generateTriagePacket(supabase as any, "t1");

    expect(result.markdown).toContain("TD-GUEST1");
    expect(result.markdown).toContain("No linked account");
    expect(result.markdown).not.toContain("secret words");
    expect(result.markdown).not.toContain("guest@example.com");
    // Guest ⇒ no account-scoped queries issued.
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
