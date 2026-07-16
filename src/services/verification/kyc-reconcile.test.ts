import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/env", () => ({
  env: { KYC_PROVIDER: "didit", KYC_API_KEY: "test-api-key" },
}));

const maybeSingleMock = vi.fn();
const updateSecondEq = vi.fn().mockResolvedValue({ error: null });
const updateFirstEq = vi.fn().mockReturnValue({ eq: updateSecondEq });
const updateMock = vi.fn().mockReturnValue({ eq: updateFirstEq });
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock }),
      }),
      update: updateMock,
    }),
  }),
}));

import { reconcilePendingKyc } from "./kyc-reconcile";

describe("reconcilePendingKyc", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    maybeSingleMock.mockReset();
    updateMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("does nothing when the profile is not pending", async () => {
    maybeSingleMock.mockResolvedValue({ data: { kyc_status: "verified", kyc_provider_ref: "sess-1" }, error: null });
    await reconcilePendingKyc("user-1");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("updates the profile when the decision is Approved", async () => {
    maybeSingleMock.mockResolvedValue({ data: { kyc_status: "pending", kyc_provider_ref: "sess-1" }, error: null });
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ status: "Approved" }) });
    await reconcilePendingKyc("user-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://verification.didit.me/v3/session/sess-1/decision/",
      { headers: { "x-api-key": "test-api-key" } },
    );
    expect(updateMock).toHaveBeenCalledWith({ kyc_status: "verified" });
  });

  it("leaves pending untouched when the decision is still In Review", async () => {
    maybeSingleMock.mockResolvedValue({ data: { kyc_status: "pending", kyc_provider_ref: "sess-1" }, error: null });
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ status: "In Review" }) });
    await reconcilePendingKyc("user-1");
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("swallows fetch failures (webhook remains source of truth)", async () => {
    maybeSingleMock.mockResolvedValue({ data: { kyc_status: "pending", kyc_provider_ref: "sess-1" }, error: null });
    fetchMock.mockRejectedValue(new Error("network"));
    await expect(reconcilePendingKyc("user-1")).resolves.toBeUndefined();
  });
});
