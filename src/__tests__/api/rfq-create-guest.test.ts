import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks (service + supabase clients) — installed before the route handler
// imports its dependencies.
// ---------------------------------------------------------------------------

const createRfq = vi.fn().mockResolvedValue({ id: "rfq-1" });
const createGuestRfq = vi.fn().mockResolvedValue({ id: "rfq-2" });
vi.mock("@/services/marketplace/rfq-service", () => ({
  createRfq: (...a: unknown[]) => createRfq(...a),
  createGuestRfq: (...a: unknown[]) => createGuestRfq(...a),
}));

const getUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => getUser() },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({ admin: true })),
}));

// ---------------------------------------------------------------------------
// Import handler after mocks are registered.
// ---------------------------------------------------------------------------

import { POST } from "@/app/api/rfq/create/route";

const GUEST_BODY = {
  service_category: "plumber",
  title: "Fix leaking kitchen tap",
  description:
    "The kitchen mixer tap has been dripping constantly for a week and the base is now leaking into the cupboard below.",
  property_postcode: "SW1A 1AA",
  urgency_level: "normal",
  target_provider_id: "123e4567-e89b-12d3-a456-426614174000",
  source: "trader_profile_modal",
  contact_name: "Jane Smith",
  contact_email: "jane@example.com",
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/rfq/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  createRfq.mockClear();
  createGuestRfq.mockClear();
});

describe("POST /api/rfq/create", () => {
  it("uses the authed path when a user is present", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    const res = await POST(makeRequest(GUEST_BODY));
    expect(res.status).toBe(201);
    expect(createRfq).toHaveBeenCalled();
    expect(createGuestRfq).not.toHaveBeenCalled();
  });

  it("uses the guest path (admin client) when logged out", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(makeRequest(GUEST_BODY));
    expect(res.status).toBe(201);
    expect(createGuestRfq).toHaveBeenCalled();
    expect(createRfq).not.toHaveBeenCalled();
  });

  it("silently accepts but drops honeypot submissions", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(makeRequest({ ...GUEST_BODY, company: "spambot ltd" }));
    expect(res.status).toBe(201);
    expect(createGuestRfq).not.toHaveBeenCalled();
  });

  it("rejects a guest submission without contact email", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const { contact_email: _drop, ...noEmail } = GUEST_BODY;
    const res = await POST(makeRequest(noEmail));
    expect(res.status).toBe(400);
    expect(createGuestRfq).not.toHaveBeenCalled();
  });
});
