import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("vouch/referral security correction contracts", () => {
  it("makes referral attribution service-owned and preserves prior attribution", () => {
    const sql = read("supabase/migrations/20260716184302_attribute_referral_signup.sql");
    expect(sql).toMatch(/revoke\s+insert\s*,\s*update\s+on\s+public\.referrals\s+from\s+authenticated/i);
    expect(sql).toMatch(/where\s+r\.referred_id\s*=\s*p_referred_profile_id[\s\S]*already_attributed/i);
    expect(sql).toMatch(/grant execute on function public\.attribute_referral_signup[\s\S]*to service_role/i);
  });

  it("exposes a provider-owned pending-request revocation transition", () => {
    const sql = read("supabase/migrations/20260716184302_attribute_referral_signup.sql");
    const service = read("src/services/referrals/vouch-referral-service.ts");
    expect(sql).toContain("revoke_vouch_request");
    expect(sql).toMatch(/status\s*=\s*'revoked'/);
    expect(sql).toContain("revoked_at = now()");
    expect(sql).toMatch(/grant execute on function public\.revoke_vouch_request[\s\S]*to service_role/i);
    expect(service).toContain('admin.rpc("revoke_vouch_request"');
  });

  it("uses canonical provider identity in every gated provider route", () => {
    const files = [
      "src/app/api/provider/services/route.ts",
      "src/app/api/provider/services/[id]/route.ts",
      "src/app/api/provider/service-areas/route.ts",
      "src/app/api/provider/portfolio/route.ts",
      "src/app/api/provider/portfolio/[id]/route.ts",
      "src/app/api/provider/portfolio/reorder/route.ts",
      "src/app/api/provider/quotes/route.ts",
      "src/app/api/provider/quotes/[id]/pdf/route.ts",
      "src/app/api/provider/invoices/route.ts",
      "src/app/api/provider/invoices/[id]/paid/route.ts",
      "src/app/api/provider/invoices/[id]/pdf/route.ts",
    ];
    for (const file of files) {
      const source = read(file);
      expect(source, file).not.toMatch(/from\("service_provider_details"\)[\s\S]{0,100}\.select\("id(?:,|\")/);
      expect(source, file).not.toContain("providerProfile?.id");
    }
  });

  it("makes onsite create and confirm transaction-gated", () => {
    for (const file of [
      "src/app/api/provider/payments/onsite/route.ts",
      "src/app/api/provider/payments/onsite/confirm/route.ts",
    ]) {
      expect(read(file), file).toContain('requireProviderAccess("transaction")');
    }
  });

  it("passes a trusted path requirement from proxy to the provider layout", () => {
    expect(read("src/proxy.ts")).toContain("x-provider-access-requirement");
    const layout = read("src/app/(protected)/dashboard/provider/layout.tsx");
    expect(layout).toContain('headers()');
    expect(layout).toContain('headersList.get("x-provider-access-requirement")');
    expect(layout).not.toContain('evaluateProviderAccess(accessState, "progress")');
  });
});
