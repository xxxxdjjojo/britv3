import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260716184302_attribute_referral_signup.sql"),
  "utf8",
);
const service = readFileSync(
  resolve(process.cwd(), "src/services/referrals/vouch-referral-service.ts"),
  "utf8",
);

describe("provider invitation authorization and event semantics", () => {
  it("authorizes invitation creation inside service-only database functions", () => {
    expect(migration).toContain("create_vouch_request");
    expect(migration).toContain("create_provider_referral_invite");
    expect(migration).toMatch(/active_role\s*=\s*'service_provider'/);
    expect(service).toContain('admin.rpc("create_vouch_request"');
    expect(service).toContain('admin.rpc("create_provider_referral_invite"');
  });

  it("emits completed events only from completed transitions", () => {
    const statusRead = service.slice(
      service.indexOf("export async function getVouchGateStatus"),
      service.indexOf("export async function createReferralInvite"),
    );
    const creditIssue = service.slice(
      service.indexOf("export async function issueReferralCredit"),
    );
    expect(statusRead).not.toContain('captureBusinessEvent("gate_completed"');
    expect(creditIssue).not.toContain('captureBusinessEvent("credit_applied"');
    expect(service).toContain("gate_just_completed");
    expect(service).toContain("trackReferralCreditApplied");
  });
});
