import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/services/email/email-service", () => ({
  sendLandlordDiaryReminder: vi.fn(async () => undefined),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { sendLandlordDiaryReminder } from "@/services/email/email-service";
import type { DatedDeadline } from "@/content/rra-deadlines";
import {
  computeDueReminders,
  landlordDeadlineDiary,
} from "./landlord-deadline-diary";

const mockCreateAdminClient = vi.mocked(createAdminClient);
const mockSend = vi.mocked(sendLandlordDiaryReminder);

function fixtureDeadline(overrides: Partial<DatedDeadline> = {}): DatedDeadline {
  return {
    id: "s21-longstop",
    kind: "dated",
    date: "2026-07-31",
    title: "Pre-commencement Section 21 claims long-stop",
    summary: "Claims relying on a pre-1 May 2026 notice must reach court.",
    appliesTo: ["pre_may_tenancies"],
    citations: [
      {
        instrument: "Renters' Rights Act 2025",
        section: "Act as enacted (c. 26)",
        url: "https://www.legislation.gov.uk/ukpga/2025/26",
      },
    ],
    agentUsuallyHandles: true,
    ...overrides,
  };
}

/** Minimal step harness: runs step.run callbacks immediately. */
function makeStep() {
  return {
    run: vi.fn(async (_id: string, fn: () => Promise<unknown>) => fn()),
    sleep: vi.fn(async () => undefined),
  };
}

/** Admin-client stub returning the given confirmed subscriber emails. */
function buildClient(emails: string[]) {
  const from = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(async () => ({
          data: emails.map((email) => ({ email })),
          error: null,
        })),
      })),
    })),
  }));
  return { from } as const;
}

// The Inngest createFunction result exposes the handler under `.fn`.
const handler = (landlordDeadlineDiary as unknown as {
  fn: (ctx: { event: { data: unknown }; step: ReturnType<typeof makeStep> }) => Promise<unknown>;
}).fn;

describe("computeDueReminders", () => {
  const entry = fixtureDeadline();

  it.each([
    ["2026-07-01T08:00:00Z", 30],
    ["2026-07-24T08:00:00Z", 7],
    ["2026-07-30T23:59:00Z", 1],
  ])("matches the offset at %s (T-%d)", (now, offset) => {
    const due = computeDueReminders([entry], new Date(now));
    expect(due).toHaveLength(1);
    expect(due[0].daysUntil).toBe(offset);
    expect(due[0].entry.id).toBe("s21-longstop");
  });

  it("does not match non-offset days, deadline day, or past deadlines", () => {
    expect(computeDueReminders([entry], new Date("2026-07-16T08:00:00Z"))).toHaveLength(0);
    expect(computeDueReminders([entry], new Date("2026-07-31T08:00:00Z"))).toHaveLength(0);
    expect(computeDueReminders([entry], new Date("2026-08-02T08:00:00Z"))).toHaveLength(0);
  });

  it("returns one reminder per due deadline", () => {
    const other = fixtureDeadline({ id: "other", date: "2026-08-23" });
    // 2026-07-24 → s21-longstop is T-7 AND other is T-30.
    const due = computeDueReminders([entry, other], new Date("2026-07-24T08:00:00Z"));
    expect(due.map((reminder) => [reminder.entry.id, reminder.daysUntil])).toEqual([
      ["s21-longstop", 7],
      ["other", 30],
    ]);
  });
});

describe("landlordDeadlineDiary inngest function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    process.env.UNSUBSCRIBE_TOKEN_SECRET = "test-secret-for-drip";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sends a T-7 reminder to every confirmed subscriber with unsubscribe + calendar links", async () => {
    // Real content: s21-longstop is dated 2026-07-31 → T-7 is 2026-07-24.
    vi.setSystemTime(new Date("2026-07-24T08:00:00Z"));
    mockCreateAdminClient.mockReturnValue(
      buildClient(["a@example.com", "b@example.com"]) as never,
    );
    const step = makeStep();

    const result = (await handler({ event: { data: {} }, step })) as {
      status: string;
      sent: number;
    };

    expect(result.status).toBe("sent");
    expect(result.sent).toBe(2);
    expect(mockSend).toHaveBeenCalledTimes(2);

    const first = mockSend.mock.calls[0][0];
    expect(first.to).toBe("a@example.com");
    expect(first.daysUntil).toBe(7);
    expect(first.deadlineTitle).toContain("Section 21");
    expect(first.deadlineDateLabel).toBe("31 July 2026");
    expect(first.citationUrl).toContain("legislation.gov.uk/ukpga/2025/26");
    expect(first.unsubscribeUrl).toContain("/api/newsletter/unsubscribe?token=");
    expect(first.calendarUrl).toContain("/api/landlords/deadline-diary/");
    expect(first.calendarUrl).toContain("/calendar.ics");
  });

  it("does nothing on a day with no due deadline", async () => {
    vi.setSystemTime(new Date("2026-06-10T08:00:00Z"));
    mockCreateAdminClient.mockReturnValue(buildClient(["a@example.com"]) as never);
    const step = makeStep();

    const result = (await handler({ event: { data: {} }, step })) as { status: string };

    expect(result.status).toBe("no_reminders_due");
    expect(step.run).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("stops after the subscriber load when nobody is confirmed", async () => {
    vi.setSystemTime(new Date("2026-07-24T08:00:00Z"));
    mockCreateAdminClient.mockReturnValue(buildClient([]) as never);
    const step = makeStep();

    const result = (await handler({ event: { data: {} }, step })) as { status: string };

    expect(result.status).toBe("no_subscribers");
    expect(mockSend).not.toHaveBeenCalled();
  });
});
