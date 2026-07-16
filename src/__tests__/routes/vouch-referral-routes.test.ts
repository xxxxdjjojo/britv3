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
    expect(referralService).not.toMatch(/href=["'](?:#|javascript:|)["']/i);
  });
});
