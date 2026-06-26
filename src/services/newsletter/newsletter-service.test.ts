import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks — admin client is stubbed per test with a chainable builder.
// ---------------------------------------------------------------------------

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { subscribeToNewsletter } from "@/services/newsletter/newsletter-service";

const mockCreateAdminClient = vi.mocked(createAdminClient);

/**
 * Builds a minimal Supabase admin-client stub covering the two query shapes the
 * service uses:
 *   - select(...).eq(...).maybeSingle()  → lookup by email
 *   - insert(...)                        → new subscriber
 *   - update(...).eq(...)                → reactivate
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
  const eqSelect = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq: eqSelect }));

  const insert = vi.fn(async () => ({ error: opts.insertError ?? null }));

  const eqUpdate = vi.fn(async () => ({ error: opts.updateError ?? null }));
  const update = vi.fn(() => ({ eq: eqUpdate }));

  const from = vi.fn(() => ({ select, insert, update }));

  return { from, insert, update, eqUpdate } as const;
}

describe("subscribeToNewsletter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a new subscriber and reports alreadySubscribed: false", async () => {
    const client = buildClient({ lookup: { data: null } });
    mockCreateAdminClient.mockReturnValue(client as never);

    const result = await subscribeToNewsletter({ email: "New@Example.com", source: "blog" });

    expect(result).toEqual({ ok: true, alreadySubscribed: false });
    // Email is normalised to lower-case on insert.
    expect(client.insert).toHaveBeenCalledWith({
      email: "new@example.com",
      source: "blog",
    });
  });

  it("returns alreadySubscribed: true without inserting when the email exists", async () => {
    const client = buildClient({
      lookup: { data: { id: "row-1", status: "subscribed" } },
    });
    mockCreateAdminClient.mockReturnValue(client as never);

    const result = await subscribeToNewsletter({ email: "dupe@example.com" });

    expect(result).toEqual({ ok: true, alreadySubscribed: true });
    expect(client.insert).not.toHaveBeenCalled();
    expect(client.update).not.toHaveBeenCalled();
  });

  it("reactivates an unsubscribed row and reports alreadySubscribed: true", async () => {
    const client = buildClient({
      lookup: { data: { id: "row-2", status: "unsubscribed" } },
    });
    mockCreateAdminClient.mockReturnValue(client as never);

    const result = await subscribeToNewsletter({ email: "back@example.com" });

    expect(result).toEqual({ ok: true, alreadySubscribed: true });
    expect(client.update).toHaveBeenCalled();
    expect(client.insert).not.toHaveBeenCalled();
  });

  it("returns ok:false invalid_email for a malformed address and never touches the DB", async () => {
    const result = await subscribeToNewsletter({ email: "not-an-email" });

    expect(result).toEqual({ ok: false, error: "invalid_email" });
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
  });
});
