import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/services/email/lifecycle/lifecycle-email-service", () => ({
  sendLifecycleStep: vi.fn(async () => "sent"),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { sendLifecycleStep } from "@/services/email/lifecycle/lifecycle-email-service";
import { lifecycleDrip } from "./lifecycle-drip";
import { LIFECYCLE_SEQUENCES } from "@/services/email/lifecycle/sequences";

const mockCreateAdminClient = vi.mocked(createAdminClient);
const mockSend = vi.mocked(sendLifecycleStep);

/**
 * Minimal step harness: runs step.run callbacks immediately, no-ops step.sleep.
 */
function makeStep() {
  return {
    run: vi.fn(async (_id: string, fn: () => Promise<unknown>) => fn()),
    sleep: vi.fn(async () => undefined),
  };
}

/**
 * Admin-client stub whose profiles select…single() returns the given active_role.
 * Stop-condition tables return no rows (user has not activated). Enrolment
 * upsert/update are no-ops.
 */
function buildClient(activeRole: string | null) {
  const from = vi.fn((table: string) => {
    if (table === "profiles") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: activeRole === null ? null : { active_role: activeRole, display_name: "Sam Renter" },
              error: null,
            })),
          })),
        })),
      };
    }
    if (table === "lifecycle_email_enrolments") {
      return {
        upsert: vi.fn(async () => ({ error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })),
        })),
      };
    }
    // stop-condition tables: no rows
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data: null, error: null })) })),
        })),
      })),
    };
  });
  return { from } as const;
}

// The Inngest createFunction result exposes the handler under `.fn`.
const handler = (lifecycleDrip as unknown as {
  fn: (ctx: { event: { data: unknown }; step: ReturnType<typeof makeStep> }) => Promise<unknown>;
}).fn;

describe("lifecycleDrip inngest function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue("sent");
  });

  it("skips roles without a sequence", async () => {
    mockCreateAdminClient.mockReturnValue(buildClient("renter") as never);
    const step = makeStep();
    const result = (await handler({
      event: { data: { userId: "u1", email: "u1@x.com", role: "service_provider" } },
      step,
    })) as { status: string };

    expect(result.status).toBe("skipped");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("sends the first step for an enrolled renter", async () => {
    mockCreateAdminClient.mockReturnValue(buildClient("renter") as never);
    const step = makeStep();

    const result = (await handler({
      event: { data: { userId: "u1", email: "u1@x.com", role: "renter" } },
      step,
    })) as { status: string; sent: number };

    expect(result.status).toBe("completed");
    // First call corresponds to the day-0 onboarding step.
    expect(mockSend.mock.calls[0][0].step.key).toBe(LIFECYCLE_SEQUENCES.renter[0].key);
    expect(mockSend).toHaveBeenCalledTimes(LIFECYCLE_SEQUENCES.renter.length);
  });

  it("stops the sequence when active_role no longer matches", async () => {
    // Profile now reports a different active role → stop before any send.
    mockCreateAdminClient.mockReturnValue(buildClient("landlord") as never);
    const step = makeStep();

    const result = (await handler({
      event: { data: { userId: "u1", email: "u1@x.com", role: "renter" } },
      step,
    })) as { status: string; reason: string };

    expect(result.status).toBe("stopped");
    expect(result.reason).toBe("role_changed");
    expect(mockSend).not.toHaveBeenCalled();
  });
});
