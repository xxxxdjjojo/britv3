import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
  })),
}));

import { proxy } from "@/proxy";

describe("referral attribution cookies", () => {
  it("survive replacement by an authentication redirect response", async () => {
    const response = await proxy(new NextRequest(
      "https://truedeed.test/dashboard?ref=ABC12345&invite=11111111-1111-4111-8111-111111111111",
    ));
    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(response.headers.get("location")).toContain("/login");
    expect(setCookie).toContain("britestate_ref=ABC12345");
    expect(setCookie).toContain("truedeed_invite=11111111-1111-4111-8111-111111111111");
  });
});
