import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Fixed-bottom safe-area guard (F14).
 *
 * All components that render a fixed/sticky bar pinned to the bottom of the
 * viewport MUST include `pb-safe` in the className of the pinned container.
 * The `.pb-safe` utility (globals.css) adds `env(safe-area-inset-bottom)` so
 * the content clears the iOS home-indicator notch.
 *
 * This test reads each file as a string (same pattern as form-control-sizing.test.ts)
 * and asserts the class is present. It will be RED before the pb-safe additions
 * and GREEN after.
 */

const ROOT = join(process.cwd(), "src");

const FIXED_BOTTOM_COMPONENTS: ReadonlyArray<{ label: string; path: string }> = [
  {
    label: "CompareBar (providers)",
    path: "components/providers/CompareBar.tsx",
  },
  {
    label: "FieldBottomNav (dashboard/provider)",
    path: "components/dashboard/provider/FieldBottomNav.tsx",
  },
  {
    label: "ConsentBanner (gdpr)",
    path: "components/gdpr/ConsentBanner.tsx",
  },
  {
    label: "CookieConsentBanner (legal)",
    path: "components/legal/CookieConsentBanner.tsx",
  },
  {
    label: "InstallPrompt (pwa)",
    path: "components/pwa/InstallPrompt.tsx",
  },
  {
    label: "MobileEnquiryBar / DevelopmentEnquiry (new-homes)",
    path: "components/new-homes/DevelopmentEnquiry.tsx",
  },
];

describe("fixed-bottom safe-area (pb-safe) guard", () => {
  for (const { label, path } of FIXED_BOTTOM_COMPONENTS) {
    it(`${label} contains pb-safe on its fixed/sticky container`, () => {
      const content = readFileSync(join(ROOT, path), "utf8");
      expect(
        content,
        `${path} is missing pb-safe. Add pb-safe to the className of the fixed/sticky bottom container element.`,
      ).toContain("pb-safe");
    });
  }
});
