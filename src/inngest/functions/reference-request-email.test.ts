import { describe, expect, it, vi, beforeEach } from "vitest";

// --- Mocks -----------------------------------------------------------------

const markSentReference = vi.fn();
const sendReferenceInvitation = vi.fn();
const getVouchRules = vi.fn();

vi.mock("@/services/provider/reference-invitation-service", () => ({
  markSentReference: (...args: unknown[]) => markSentReference(...args),
}));
vi.mock("@/services/email/email-service", () => ({
  sendReferenceInvitation: (...args: unknown[]) => sendReferenceInvitation(...args),
}));
vi.mock("@/services/provider/vouch-rules-service", () => ({
  getVouchRules: (...args: unknown[]) => getVouchRules(...args),
}));
vi.mock("@/config/brand", () => ({
  appUrl: (path = "") => `https://truedeed.co.uk${path}`,
}));

// The admin client is a chainable query builder. We return per-table rows from
// a settable fixture so each test controls the reference row + provider display.
let referenceRow: Record<string, unknown> | null;
let referenceError: unknown = null;
let profileRow: Record<string, unknown> | null;
let spdRow: Record<string, unknown> | null;

function makeQuery(table: string) {
  const result =
    table === "provider_references"
      ? { data: referenceRow, error: referenceError }
      : table === "profiles"
        ? { data: profileRow, error: null }
        : { data: spdRow, error: null };

  const builder = {
    select: () => builder,
    eq: () => builder,
    maybeSingle: () => Promise.resolve(result),
  };
  return builder;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: (table: string) => makeQuery(table) }),
}));

// Import AFTER mocks are registered.
import { handleReferenceRequestEmail } from "./reference-request-email";

// A fake step whose `run` just executes the callback (no memoization).
const step = { run: <T>(_id: string, fn: () => Promise<T>) => fn() };

function requestedEvent(referenceId = "ref-1") {
  return { name: "provider/reference.requested", data: { referenceId } };
}
function resendEvent(referenceId = "ref-1") {
  return { name: "provider/reference.resend-requested", data: { referenceId } };
}

const HEX64 = /^[0-9a-f]{64}$/;

beforeEach(() => {
  vi.clearAllMocks();
  referenceRow = {
    provider_id: "prov-1",
    referee_name: "Jordan",
    referee_email: "jordan@example.com",
    reference_type: "client",
    relationship: "past customer",
    status: "pending",
  };
  referenceError = null;
  profileRow = { display_name: "Alex Smith" };
  spdRow = { services: ["plumber"], business_name: "Smith Plumbing" };
  getVouchRules.mockResolvedValue({ invite_expiry_days: 30 });
  markSentReference.mockResolvedValue({ success: true });
  sendReferenceInvitation.mockResolvedValue({ success: true });
});

describe("handleReferenceRequestEmail", () => {
  it("does not email when the reference row is missing", async () => {
    referenceRow = null;
    const out = await handleReferenceRequestEmail({ event: requestedEvent(), step });

    expect(out).toMatchObject({ status: "not_found" });
    expect(markSentReference).not.toHaveBeenCalled();
    expect(sendReferenceInvitation).not.toHaveBeenCalled();
  });

  it.each(["declined", "verified", "revoked", "submitted"])(
    "skips (no email) when status is %s",
    async (status) => {
      referenceRow = { ...(referenceRow as object), status };
      const out = await handleReferenceRequestEmail({ event: requestedEvent(), step });

      expect(out).toMatchObject({ status: "skipped", currentStatus: status });
      expect(markSentReference).not.toHaveBeenCalled();
      expect(sendReferenceInvitation).not.toHaveBeenCalled();
    },
  );

  it("persists a 64-hex hash + future expiry and emails a URL with the raw token", async () => {
    const out = await handleReferenceRequestEmail({ event: requestedEvent(), step });

    expect(out).toMatchObject({ status: "sent", isReminder: false });

    // markSentReference called with a proper hash + future ISO expiry.
    const [, refId, opts] = markSentReference.mock.calls[0];
    expect(refId).toBe("ref-1");
    expect(opts.tokenHash).toMatch(HEX64);
    expect(new Date(opts.expiresAt).getTime()).toBeGreaterThan(Date.now());

    // Email carries a submission URL whose token is NOT the stored hash.
    const emailArg = sendReferenceInvitation.mock.calls[0][0];
    expect(emailArg.to).toBe("jordan@example.com");
    expect(emailArg.submissionUrl).toMatch(
      /^https:\/\/truedeed\.co\.uk\/reference\/.+/,
    );
    const rawToken = emailArg.submissionUrl.split("/reference/")[1];
    expect(rawToken).toBeTruthy();
    expect(rawToken).not.toBe(opts.tokenHash); // raw token, not the hash
    expect(emailArg.providerName).toBe("Alex Smith");
    expect(emailArg.providerTrade).toBe("Plumber"); // humanised via CATEGORY_LABELS
    expect(emailArg.isReminder).toBe(false);
  });

  it("marks the email as a reminder for the resend event", async () => {
    await handleReferenceRequestEmail({ event: resendEvent(), step });

    expect(sendReferenceInvitation.mock.calls[0][0].isReminder).toBe(true);
  });

  it("still sends with a sensible future expiry when vouch rules are defaults", async () => {
    getVouchRules.mockResolvedValue({ invite_expiry_days: 14 });

    const out = await handleReferenceRequestEmail({ event: requestedEvent(), step });

    expect(out).toMatchObject({ status: "sent" });
    const opts = markSentReference.mock.calls[0][2];
    expect(new Date(opts.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(sendReferenceInvitation).toHaveBeenCalledTimes(1);
  });

  it('falls back to "A trader" with no trade when the provider display is null, and still sends', async () => {
    profileRow = null;
    spdRow = null;

    const out = await handleReferenceRequestEmail({ event: requestedEvent(), step });

    expect(out).toMatchObject({ status: "sent" });
    const emailArg = sendReferenceInvitation.mock.calls[0][0];
    expect(emailArg.providerName).toBe("A trader");
    expect(emailArg.providerTrade).toBeUndefined();
    expect(sendReferenceInvitation).toHaveBeenCalledTimes(1);
  });

  it("throws when markSentReference fails (so Inngest retries)", async () => {
    markSentReference.mockResolvedValue({ success: false, error: "db down" });

    await expect(
      handleReferenceRequestEmail({ event: requestedEvent(), step }),
    ).rejects.toThrow(/markSentReference failed/);
    expect(sendReferenceInvitation).not.toHaveBeenCalled();
  });

  it("throws when the email send fails (so Inngest retries)", async () => {
    sendReferenceInvitation.mockRejectedValue(new Error("resend 500"));

    await expect(
      handleReferenceRequestEmail({ event: requestedEvent(), step }),
    ).rejects.toThrow(/resend 500/);
  });
});
