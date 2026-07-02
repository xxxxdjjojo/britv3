import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks — admin client is stubbed per test with a chainable builder.
// ---------------------------------------------------------------------------

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import {
  confirmNewsletterSubscription,
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
} from "@/services/newsletter/newsletter-service";

const mockCreateAdminClient = vi.mocked(createAdminClient);

/**
 * Builds a minimal Supabase admin-client stub covering the query shapes the
 * service uses:
 *   - select(...).eq(...).eq(...).maybeSingle()  → lookup by (email, audience)
 *   - insert(...)                                → new subscriber
 *   - update(...).eq(...)                        → status transitions
 */
function buildClient(opts: {
  lookup?: { data: { id: string; status: string } | null; error?: { code?: string } | null };
  insertError?: { code?: string } | null;
  updateError?: { code?: string } | null;
}) {
  const maybeSingle = vi.fn(async () => ({
    data: opts.lookup?.data ?? null,
    error: opts.lookup?.error ?? null,
  }));
  const eqSelect = vi.fn((): { eq: typeof eqSelect; maybeSingle: typeof maybeSingle } => ({
    eq: eqSelect,
    maybeSingle,
  }));
  const select = vi.fn(() => ({ eq: eqSelect }));

  const insert = vi.fn(async () => ({ error: opts.insertError ?? null }));

  const eqUpdate = vi.fn(async () => ({ error: opts.updateError ?? null }));
  const update = vi.fn(() => ({ eq: eqUpdate }));

  const from = vi.fn(() => ({ select, insert, update }));

  return { from, select, eqSelect, insert, update, eqUpdate } as const;
}

describe("subscribeToNewsletter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a new consumer subscriber as subscribed with no confirmation step", async () => {
    const client = buildClient({ lookup: { data: null } });
    mockCreateAdminClient.mockReturnValue(client as never);

    const result = await subscribeToNewsletter({ email: "New@Example.com", source: "blog" });

    expect(result).toEqual({
      ok: true,
      alreadySubscribed: false,
      requiresConfirmation: false,
    });
    // Email is normalised to lower-case on insert; audience defaults to consumer.
    expect(client.insert).toHaveBeenCalledWith({
      email: "new@example.com",
      source: "blog",
      audience: "consumer",
      status: "subscribed",
    });
  });

  it("inserts a double-opt-in audience as pending and requires confirmation", async () => {
    const client = buildClient({ lookup: { data: null } });
    mockCreateAdminClient.mockReturnValue(client as never);

    const result = await subscribeToNewsletter({
      email: "agent@example.com",
      source: "agent_briefing_page",
      audience: "agent_briefing",
    });

    expect(result).toEqual({
      ok: true,
      alreadySubscribed: false,
      requiresConfirmation: true,
    });
    expect(client.insert).toHaveBeenCalledWith({
      email: "agent@example.com",
      source: "agent_briefing_page",
      audience: "agent_briefing",
      status: "pending",
    });
  });

  it("dedups per (email, audience) — filters the lookup on both columns", async () => {
    const client = buildClient({ lookup: { data: null } });
    mockCreateAdminClient.mockReturnValue(client as never);

    await subscribeToNewsletter({
      email: "agent@example.com",
      audience: "landlord_diary",
    });

    expect(client.eqSelect).toHaveBeenCalledWith("email", "agent@example.com");
    expect(client.eqSelect).toHaveBeenCalledWith("audience", "landlord_diary");
  });

  it("re-subscribing a pending double-opt-in row is idempotent and still requires confirmation", async () => {
    const client = buildClient({
      lookup: { data: { id: "row-1", status: "pending" } },
    });
    mockCreateAdminClient.mockReturnValue(client as never);

    const result = await subscribeToNewsletter({
      email: "agent@example.com",
      audience: "agent_briefing",
    });

    expect(result).toEqual({
      ok: true,
      alreadySubscribed: true,
      requiresConfirmation: true,
    });
    expect(client.insert).not.toHaveBeenCalled();
    expect(client.update).not.toHaveBeenCalled();
  });

  it("returns alreadySubscribed: true without inserting when the row exists", async () => {
    const client = buildClient({
      lookup: { data: { id: "row-1", status: "subscribed" } },
    });
    mockCreateAdminClient.mockReturnValue(client as never);

    const result = await subscribeToNewsletter({ email: "dupe@example.com" });

    expect(result).toEqual({
      ok: true,
      alreadySubscribed: true,
      requiresConfirmation: false,
    });
    expect(client.insert).not.toHaveBeenCalled();
    expect(client.update).not.toHaveBeenCalled();
  });

  it("reactivates an unsubscribed consumer row straight to subscribed", async () => {
    const client = buildClient({
      lookup: { data: { id: "row-2", status: "unsubscribed" } },
    });
    mockCreateAdminClient.mockReturnValue(client as never);

    const result = await subscribeToNewsletter({ email: "back@example.com" });

    expect(result).toEqual({
      ok: true,
      alreadySubscribed: true,
      requiresConfirmation: false,
    });
    expect(client.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "subscribed" }),
    );
    expect(client.insert).not.toHaveBeenCalled();
  });

  it("re-subscribing an unsubscribed double-opt-in row goes back to pending", async () => {
    const client = buildClient({
      lookup: { data: { id: "row-3", status: "unsubscribed" } },
    });
    mockCreateAdminClient.mockReturnValue(client as never);

    const result = await subscribeToNewsletter({
      email: "back@example.com",
      audience: "agent_briefing",
    });

    expect(result).toEqual({
      ok: true,
      alreadySubscribed: true,
      requiresConfirmation: true,
    });
    expect(client.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending" }),
    );
  });

  it("treats a 23505 unique violation as already subscribed", async () => {
    const client = buildClient({
      lookup: { data: null },
      insertError: { code: "23505" },
    });
    mockCreateAdminClient.mockReturnValue(client as never);

    const result = await subscribeToNewsletter({
      email: "race@example.com",
      audience: "agent_briefing",
    });

    expect(result).toEqual({
      ok: true,
      alreadySubscribed: true,
      requiresConfirmation: true,
    });
  });

  it("returns ok:false invalid_email for a malformed address and never touches the DB", async () => {
    const result = await subscribeToNewsletter({ email: "not-an-email" });

    expect(result).toEqual({ ok: false, error: "invalid_email" });
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
  });

  it("rejects an unknown audience", async () => {
    const result = await subscribeToNewsletter({
      email: "a@b.com",
      audience: "not_a_real_audience" as never,
    });

    expect(result).toEqual({ ok: false, error: "invalid_email" });
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
  });
});

describe("confirmNewsletterSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets a pending row to subscribed with a confirmed_at timestamp", async () => {
    const client = buildClient({
      lookup: { data: { id: "row-1", status: "pending" } },
    });
    mockCreateAdminClient.mockReturnValue(client as never);

    const result = await confirmNewsletterSubscription(
      "agent@example.com",
      "agent_briefing",
    );

    expect(result).toEqual({ ok: true, alreadyConfirmed: false });
    expect(client.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "subscribed",
        confirmed_at: expect.any(String),
      }),
    );
  });

  it("is idempotent when the row is already subscribed", async () => {
    const client = buildClient({
      lookup: { data: { id: "row-1", status: "subscribed" } },
    });
    mockCreateAdminClient.mockReturnValue(client as never);

    const result = await confirmNewsletterSubscription(
      "agent@example.com",
      "agent_briefing",
    );

    expect(result).toEqual({ ok: true, alreadyConfirmed: true });
    expect(client.update).not.toHaveBeenCalled();
  });

  it("returns not_found for an unknown (email, audience)", async () => {
    const client = buildClient({ lookup: { data: null } });
    mockCreateAdminClient.mockReturnValue(client as never);

    const result = await confirmNewsletterSubscription(
      "ghost@example.com",
      "agent_briefing",
    );

    expect(result).toEqual({ ok: false, error: "not_found" });
  });
});

describe("unsubscribeFromNewsletter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets a subscribed row to unsubscribed", async () => {
    const client = buildClient({
      lookup: { data: { id: "row-1", status: "subscribed" } },
    });
    mockCreateAdminClient.mockReturnValue(client as never);

    const result = await unsubscribeFromNewsletter(
      "agent@example.com",
      "agent_briefing",
    );

    expect(result).toEqual({ ok: true, alreadyUnsubscribed: false });
    expect(client.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "unsubscribed" }),
    );
  });

  it("is idempotent for an already-unsubscribed row", async () => {
    const client = buildClient({
      lookup: { data: { id: "row-1", status: "unsubscribed" } },
    });
    mockCreateAdminClient.mockReturnValue(client as never);

    const result = await unsubscribeFromNewsletter(
      "agent@example.com",
      "agent_briefing",
    );

    expect(result).toEqual({ ok: true, alreadyUnsubscribed: true });
    expect(client.update).not.toHaveBeenCalled();
  });

  it("is idempotent for an unknown (email, audience)", async () => {
    const client = buildClient({ lookup: { data: null } });
    mockCreateAdminClient.mockReturnValue(client as never);

    const result = await unsubscribeFromNewsletter(
      "ghost@example.com",
      "agent_briefing",
    );

    expect(result).toEqual({ ok: true, alreadyUnsubscribed: true });
  });
});
