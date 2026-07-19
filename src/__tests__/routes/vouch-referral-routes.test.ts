import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function source(path: string): string {
  return readFileSync(resolve(ROOT, path), "utf8");
}

describe("vouch and referral public route contract", () => {
  it("ships real join, token-vouch, and public-vouch destinations", () => {
    const routes = [
      "src/app/(main)/join/page.tsx",
      "src/app/(main)/vouch/[token]/page.tsx",
      "src/app/(main)/vouched/[slug]/page.tsx",
    ];

    for (const route of routes) {
      expect(() => source(route), `${route} must resolve to a route`).not.toThrow();
    }

    const referralService = source("src/services/referrals/unified-referral-service.ts");
    expect(referralService).toContain("/join?ref=${code}");
    const vouchReferralService = source("src/services/referrals/vouch-referral-service.ts");
    expect(vouchReferralService).toContain("/join?invite=${inviteToken}");
    expect(referralService).not.toMatch(/href=["'](?:#|javascript:|)["']/i);
  });

  it("exposes the agreed server API and analytics vocabulary", () => {
    const serverModule = source("src/services/referrals/vouch-referral-service.ts");
    for (const functionName of [
      "createVouchRequest",
      "getVouchInvite",
      "respondToVouch",
      "revokeVouchRequest",
      "getVouchGateStatus",
      "createReferralInvite",
      "advanceProviderReferral",
      "issueReferralCredit",
    ]) {
      expect(serverModule).toContain(`export async function ${functionName}`);
    }
    for (const eventName of [
      "vouch_request_sent",
      "vouch_accepted",
      "gate_completed",
      "referral_converted",
      "credit_applied",
    ]) {
      expect(serverModule).toContain(`captureBusinessEvent(\"${eventName}\"`);
    }
  });
});
