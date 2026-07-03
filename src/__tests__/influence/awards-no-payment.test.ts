import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Honest Agent Awards integrity guard (Influence Strategy 3.5).
 *
 * The awards' entire value is that they cannot be bought: no payment path
 * may ever exist in the awards module, votes may never be a scoring input,
 * and the minimum-sample suppression constant must stay exported (it is
 * quoted verbatim on the public methodology page).
 */

const SRC = path.resolve(__dirname, "..", "..");
const APP = path.join(SRC, "app");

const AWARDS_DIRS = [
  path.join(APP, "(main)", "awards"),
  path.join(SRC, "services", "awards"),
  path.join(APP, "api", "awards"),
];

// Awards files that live OUTSIDE the awards dirs. The agent-dashboard
// standing panel sits among files that legitimately reference billing, so it
// is scanned individually — do not widen this to the whole dashboard dir.
const AWARDS_FILES = [
  path.join(APP, "(protected)", "dashboard", "agent", "AwardStandingPanel.tsx"),
];

const readDirDeep = (dir: string): { file: string; body: string }[] => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true })
    .map(String)
    .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
    .map((f) => ({
      file: path.join(dir, f),
      body: readFileSync(path.join(dir, f), "utf8"),
    }));
};

describe("Honest Agent Awards — no payment, no votes", () => {
  it("awards dirs exist and are non-empty", () => {
    for (const dir of AWARDS_DIRS) {
      expect(existsSync(dir), `missing awards dir: ${dir}`).toBe(true);
      expect(readDirDeep(dir).length, `no source files in ${dir}`).toBeGreaterThan(0);
    }
    for (const file of AWARDS_FILES) {
      expect(existsSync(file), `missing awards file: ${file}`).toBe(true);
    }
  });

  it("no payment code path anywhere in the awards module", () => {
    const paymentPattern = /stripe|payment_intent|checkout/i;
    const sources = [
      ...AWARDS_DIRS.flatMap(readDirDeep),
      ...AWARDS_FILES.map((file) => ({ file, body: readFileSync(file, "utf8") })),
    ];
    for (const { file, body } of sources) {
      expect(
        paymentPattern.test(body),
        `payment reference found in ${file}`,
      ).toBe(false);
    }
  });

  it("scoring service has no vote inputs", () => {
    const scoring = readFileSync(
      path.join(SRC, "services", "awards", "award-scoring-service.ts"),
      "utf8",
    );
    expect(scoring).not.toMatch(/votes?_count|vote_total|voteCount|popularity/i);
  });

  it("scoring service exports the disclosed min-sample constant", () => {
    const scoring = readFileSync(
      path.join(SRC, "services", "awards", "award-scoring-service.ts"),
      "utf8",
    );
    expect(scoring).toMatch(/export const AWARD_MIN_SAMPLE = \d+/);
  });

  it("methodology page quotes the exported constant, not a hardcoded number", () => {
    const methodology = readFileSync(
      path.join(APP, "(main)", "awards", "methodology", "page.tsx"),
      "utf8",
    );
    expect(methodology).toContain("AWARD_MIN_SAMPLE");
    expect(methodology).toMatch(/fall[- ]through/i);
  });
});
