import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const OFFERS_ROUTE = join(process.cwd(), "src/app/api/offers/[id]/route.ts");
const OFFERS_SERVICE = join(process.cwd(), "src/services/offers/offers-service.ts");

describe("offer withdrawal route contract", () => {
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
});
