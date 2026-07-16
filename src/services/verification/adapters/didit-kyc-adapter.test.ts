import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/env", () => ({
  env: {
    KYC_PROVIDER: "didit",
    KYC_API_KEY: "test-api-key",
    DIDIT_WORKFLOW_ID: "wf-123",
  },
}));

import { DiditKycAdapter } from "./didit-kyc-adapter";

describe("DiditKycAdapter", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("creates a session and returns providerRef + redirectUrl", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        session_id: "sess-abc",
        url: "https://verify.didit.me/session/xyz",
      }),
    });

    const adapter = new DiditKycAdapter();
    const session = await adapter.createSession({
      userId: "user-1",
      returnUrl: "https://www.truedeed.co.uk/dashboard/provider/verification?kyc=return",
    });

    expect(session).toEqual({
      providerRef: "sess-abc",
      status: "pending",
      redirectUrl: "https://verify.didit.me/session/xyz",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://verification.didit.me/v3/session/");
    expect(init.method).toBe("POST");
    expect(init.headers["x-api-key"]).toBe("test-api-key");
    expect(JSON.parse(init.body)).toEqual({
      workflow_id: "wf-123",
      vendor_data: "user-1",
      callback: "https://www.truedeed.co.uk/dashboard/provider/verification?kyc=return",
    });
  });

  it("throws on a non-2xx response", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) });
    const adapter = new DiditKycAdapter();
    await expect(adapter.createSession({ userId: "user-1" })).rejects.toThrow(/didit session create failed \(401\)/i);
  });

  it("throws when the response is missing session_id or url", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ session_id: "sess-abc" }) });
    const adapter = new DiditKycAdapter();
    await expect(adapter.createSession({ userId: "user-1" })).rejects.toThrow(/missing session_id\/url/i);
  });
});
