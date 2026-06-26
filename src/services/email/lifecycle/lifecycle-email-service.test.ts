import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.RESEND_API_KEY = process.env.RESEND_API_KEY ?? "re_test_dummy";

const { resendSendMock } = vi.hoisted(() => ({
  resendSendMock: vi.fn(async () => ({ data: { id: "resend-123" }, error: null })),
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function Resend() {
    return { emails: { send: resendSendMock } };
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

// Reuse the real BASE_URL but stub the marketing-preference check.
vi.mock("@/services/email/email-service", () => ({
  checkUserEmailPref: vi.fn(async () => true),
  BASE_URL: "https://truedeed.co.uk",
}));

vi.mock("@/lib/unsubscribe-token", () => ({
  generateUnsubscribeToken: vi.fn(() => "unsub-token"),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { checkUserEmailPref } from "@/services/email/email-service";
import { sendLifecycleStep } from "./lifecycle-email-service";
import { LIFECYCLE_SEQUENCES } from "./sequences";

const mockCreateAdminClient = vi.mocked(createAdminClient);
const mockCheckPref = vi.mocked(checkUserEmailPref);

const onboardingStep = LIFECYCLE_SEQUENCES.renter[0]; // day-0 onboarding
const marketingStep = LIFECYCLE_SEQUENCES.renter[2]; // +5d marketing

/**
 * Chainable admin-client stub.
 *  - lifecycle_email_sends: select…maybeSingle() returns `alreadySent`,
 *    insert() records the send.
 *  - profiles: select…single() returns `preferences` (global-unsub signal).
 *  - email_logs: insert() no-op.
 */
function buildClient(opts: {
  alreadySent?: boolean;
  digestFrequency?: string;
}) {
  const sendsInsert = vi.fn(async () => ({ error: null }));
  const logsInsert = vi.fn(async () => ({ error: null }));

  const from = vi.fn((table: string) => {
    if (table === "lifecycle_email_sends") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: opts.alreadySent ? { id: "existing" } : null,
                    error: null,
                  })),
                })),
              })),
            })),
          })),
        })),
        insert: sendsInsert,
      };
    }
    if (table === "profiles") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: { preferences: { digest_frequency: opts.digestFrequency ?? "daily" } },
              error: null,
            })),
          })),
        })),
      };
    }
    // email_logs (and any other)
    return { insert: logsInsert };
  });

  return { from, sendsInsert, logsInsert } as const;
}

describe("sendLifecycleStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckPref.mockResolvedValue(true);
    resendSendMock.mockResolvedValue({ data: { id: "resend-123" }, error: null });
  });

  it("sends an onboarding step and records it", async () => {
    const client = buildClient({ alreadySent: false });
    mockCreateAdminClient.mockReturnValue(client as never);

    const result = await sendLifecycleStep({
      userId: "u1",
      email: "u1@example.com",
      role: "renter",
      step: onboardingStep,
    });

    expect(result).toBe("sent");
    expect(resendSendMock).toHaveBeenCalledTimes(1);
    expect(client.sendsInsert).toHaveBeenCalledWith({
      user_id: "u1",
      role: "renter",
      step_key: onboardingStep.key,
    });
  });

  it("skips when the step was already sent (idempotency)", async () => {
    const client = buildClient({ alreadySent: true });
    mockCreateAdminClient.mockReturnValue(client as never);

    const result = await sendLifecycleStep({
      userId: "u1",
      email: "u1@example.com",
      role: "renter",
      step: onboardingStep,
    });

    expect(result).toBe("skipped_idempotent");
    expect(resendSendMock).not.toHaveBeenCalled();
  });

  it("skips a marketing step when the marketing preference is off", async () => {
    mockCheckPref.mockResolvedValue(false);
    const client = buildClient({ alreadySent: false });
    mockCreateAdminClient.mockReturnValue(client as never);

    const result = await sendLifecycleStep({
      userId: "u1",
      email: "u1@example.com",
      role: "renter",
      step: marketingStep,
    });

    expect(result).toBe("skipped_marketing_pref");
    expect(resendSendMock).not.toHaveBeenCalled();
  });

  it("still sends an onboarding step even when the marketing preference is off", async () => {
    mockCheckPref.mockResolvedValue(false);
    const client = buildClient({ alreadySent: false });
    mockCreateAdminClient.mockReturnValue(client as never);

    const result = await sendLifecycleStep({
      userId: "u1",
      email: "u1@example.com",
      role: "renter",
      step: onboardingStep,
    });

    expect(result).toBe("sent");
    expect(resendSendMock).toHaveBeenCalledTimes(1);
  });

  it("skips every step when the user is globally unsubscribed", async () => {
    const client = buildClient({ alreadySent: false, digestFrequency: "never" });
    mockCreateAdminClient.mockReturnValue(client as never);

    const result = await sendLifecycleStep({
      userId: "u1",
      email: "u1@example.com",
      role: "renter",
      step: onboardingStep,
    });

    expect(result).toBe("skipped_unsubscribed");
    expect(resendSendMock).not.toHaveBeenCalled();
  });
});
