import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

test.describe("vouch/referral ship-gate contracts", () => {
  test("serializes the shared local stack without broadening database grants", () => {
    const runner = read("scripts/e2e-vouch-referral-local.sh");
    expect(runner).toMatch(/while\s+!\s+mkdir\s+"\$LOCK_DIR"/);
    expect(runner).toMatch(/trap\s+cleanup_lock\s+EXIT\s+INT\s+TERM/);
    expect(runner).not.toMatch(/grant\s+all\s+privileges/i);
  });

  test("pins the audited Supabase CLI and preserves dashboard link coverage", () => {
    const app = read(".github/workflows/app-ci.yml");
    const performance = read(".github/workflows/perf-budget.yml");
    expect(`${app}\n${performance}`).not.toContain("version: 2.108.0");
    expect(app).toContain("version: 2.109.1");
    expect(performance).toContain("version: 2.109.1");
    expect(app).toContain("dashboard-navigation.spec.ts");
    expect(app).not.toMatch(/Link E2E[\s\S]{0,300}continue-on-error:\s*true/);
  });

  test("uses a referral invite that the deterministic seed actually creates", () => {
    const lighthouse = read("lighthouserc.vouch-referral.json");
    const seed = read("scripts/e2e-vouch-referral-seed.mjs");
    const invite = new URL(
      JSON.parse(lighthouse).ci.collect.url.find((url: string) => url.includes("/join?invite=")),
    ).searchParams.get("invite");
    expect(invite).toBeTruthy();
    expect(seed).toContain(`PRIMARY_REFERRAL_INVITE_TOKEN = "${invite}"`);
  });

  test("always-upload steps never replace the real test result with a missing-artifact failure", () => {
    for (const workflow of [
      ".github/workflows/app-ci.yml",
      ".github/workflows/perf-budget.yml",
      ".github/workflows/production-link-health.yml",
    ]) {
      const source = read(workflow);
      expect(source).not.toMatch(/if:\s*always\(\)[\s\S]{0,400}if-no-files-found:\s*error/);
    }
  });
});
