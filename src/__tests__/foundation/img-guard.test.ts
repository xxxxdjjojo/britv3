/**
 * IMG MIGRATION RATCHET
 *
 * Asserts that files we migrated from raw <img> to next/image no longer
 * contain a raw <img tag. This locks the migration without failing on
 * intentionally-skipped files.
 *
 * SKIPPED (intentional — see report):
 *   - seller/agents/AgentCard.tsx        : avatar_url is a dynamic user URL (could be any host)
 *   - auth/TwoFactorSetupFlow.tsx        : qrCode is a data: URI (blob/data-URI exempt)
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "src/components");

const MIGRATED = [
  "search/MapPropertyCard.tsx",
  "seller/ListingCard.tsx",
  "dashboard/provider/PortfolioItemCard.tsx",
  "dashboard/agent/listings/ActiveListings.tsx",
  "dashboard/agent/listings/SoldLetListings.tsx",
];

describe("img migration ratchet", () => {
  for (const rel of MIGRATED) {
    it(`${rel} — no raw <img tag (migrated to next/image)`, () => {
      const content = readFileSync(join(ROOT, rel), "utf8");
      // Allow <img inside comments or strings but not as a JSX tag.
      // A raw <img followed by space or > indicates a JSX element.
      const hasRawImg = /<img[\s>]/g.test(content);
      expect(hasRawImg, `Found raw <img in ${rel} — should be using next/image`).toBe(false);
    });
  }
});

describe("card-tokens exports", () => {
  it("exports all required constants with correct values", async () => {
    const tokens = await import("@/components/cards/card-tokens");
    expect(typeof tokens.CARD_IMAGE_ASPECT).toBe("string");
    expect(typeof tokens.CARD_RADIUS).toBe("string");
    expect(typeof tokens.CARD_SURFACE).toBe("string");
    expect(typeof tokens.CARD_BADGE_PLACEMENT).toBe("string");
    expect(typeof tokens.CARD_SAVE_BTN_PLACEMENT).toBe("string");
    expect(tokens.CARD_IMAGE_ASPECT).toContain("16/10");
    expect(tokens.CARD_RADIUS).toBe("rounded-xl");
  });
});
