import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC = path.resolve(__dirname, "..", "..");

const read = (p: string): string => (existsSync(p) ? readFileSync(p, "utf8") : "");

describe("3.3 Landlord Transition Clinics — contract tests", () => {
  const pagePath = path.join(
    SRC,
    "app",
    "(main)",
    "landlords",
    "clinics",
    "page.tsx",
  );
  const contentPath = path.join(SRC, "content", "clinics", "sessions.ts");

  it("page file exists", () => {
    expect(existsSync(pagePath)).toBe(true);
  });

  it("page contains FAQPage JSON-LD", () => {
    const body = read(pagePath);
    expect(body).toContain("FAQPage");
  });

  it("clinics content directory exists", () => {
    expect(existsSync(path.join(SRC, "content", "clinics"))).toBe(true);
  });

  it("content file exports PAST_SESSIONS", () => {
    const body = read(contentPath);
    expect(body).toContain("PAST_SESSIONS");
  });

  it("content file exports UPCOMING_SESSION", () => {
    const body = read(contentPath);
    expect(body).toContain("UPCOMING_SESSION");
  });

  it("ClinicSession type has required shape fields", () => {
    const body = read(contentPath);
    expect(body).toContain("ClinicSession");
    expect(body).toContain("recordingUrl");
    expect(body).toContain("transcriptExcerpt");
    expect(body).toContain("faqs");
  });

  it("PAST_SESSIONS is exported as an array (empty by default)", () => {
    const body = read(contentPath);
    // Must be assignable as ReadonlyArray — check the type annotation
    expect(body).toMatch(/PAST_SESSIONS.*ReadonlyArray|ReadonlyArray.*PAST_SESSIONS/);
  });
});

describe("3.6 Boxing Day automation — contract tests", () => {
  const fnPath = path.join(
    SRC,
    "inngest",
    "functions",
    "boxing-day-annual-push.ts",
  );

  it("function file exists", () => {
    expect(existsSync(fnPath)).toBe(true);
  });

  it("has the 26 Dec cron trigger", () => {
    const body = read(fnPath);
    expect(body).toContain("0 6 26 12 *");
  });

  it("fires truedeed/report-snapshots.refresh-requested", () => {
    const body = read(fnPath);
    expect(body).toContain("truedeed/report-snapshots.refresh-requested");
  });

  it("revalidates both report pages", () => {
    const body = read(fnPath);
    expect(body).toContain("/reports/reality-gap");
    expect(body).toContain("/reports/time-to-sell");
  });
});
