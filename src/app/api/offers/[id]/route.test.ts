import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const routeMocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  createClient: vi.fn(),
  isServiceError: vi.fn(),
  withdrawOffer: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: routeMocks.createAdminClient,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: routeMocks.createClient,
}));

vi.mock("@/services/offers/offers-service", () => ({
  isServiceError: routeMocks.isServiceError,
  withdrawOffer: routeMocks.withdrawOffer,
}));

const ROOT = process.cwd();
const OFFERS_ROUTE = join(ROOT, "src/app/api/offers/[id]/route.ts");
const OFFERS_SERVICE = join(ROOT, "src/services/offers/offers-service.ts");

describe("offer withdrawal route contract", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("does not use the service-role admin client for user-triggered offer withdrawal", () => {
    const source = readFileSync(OFFERS_ROUTE, "utf8");

    expect(source).not.toContain("@/lib/supabase/admin");
    expect(source).not.toContain("createAdminClient");
  });

  it("withdraws offers through the constrained withdraw_offer RPC", () => {
    const serviceSource = readFileSync(OFFERS_SERVICE, "utf8");

    expect(serviceSource).toContain("withdraw_offer");
    expect(serviceSource).toContain(".rpc(");
  });

  it("withdraws with the authenticated Supabase client instead of creating an admin client", async () => {
    vi.resetModules();
    routeMocks.createAdminClient.mockReset();
    routeMocks.createClient.mockReset();
    routeMocks.isServiceError.mockReset();
    routeMocks.withdrawOffer.mockReset();

    const authenticatedClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user_test_123" } },
          error: null,
        }),
      },
    };
    const adminClient = { auth: { admin: {} } };
    routeMocks.createClient.mockResolvedValue(authenticatedClient);
    routeMocks.createAdminClient.mockReturnValue(adminClient);
    routeMocks.withdrawOffer.mockResolvedValue({ id: "offer_test_123" });
    routeMocks.isServiceError.mockReturnValue(false);

    vi.doMock(join(ROOT, "src/lib/supabase/admin.ts"), () => ({
      createAdminClient: routeMocks.createAdminClient,
    }));
    vi.doMock(join(ROOT, "src/lib/supabase/server.ts"), () => ({
      createClient: routeMocks.createClient,
    }));
    vi.doMock(join(ROOT, "src/services/offers/offers-service.ts"), () => ({
      isServiceError: routeMocks.isServiceError,
      withdrawOffer: routeMocks.withdrawOffer,
    }));

    const { PATCH } = await import("./route");
    const request = new Request("https://britestate.test/api/offers/offer_test_123", {
      method: "PATCH",
    });
    const response = await PATCH(request as Parameters<typeof PATCH>[0], {
      params: Promise.resolve({ id: "offer_test_123" }),
    });

    expect(response.status).toBe(200);
    expect(routeMocks.createAdminClient).not.toHaveBeenCalled();
    expect(routeMocks.withdrawOffer).toHaveBeenCalledWith(
      authenticatedClient,
      "user_test_123",
      "offer_test_123",
    );
  });
});
