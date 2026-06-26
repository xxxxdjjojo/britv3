/**
 * Post-a-Job / RFQ link-integrity contract.
 *
 * Mirrors dashboard-link-integrity.test.ts but for the "Post a Job" feature
 * surface: the public job board (`/jobs`), the post-a-job page, the RFQ form,
 * and the provider jobs/leads/quotes components. Every hard-coded internal href
 * (and `router.push`/`redirect` target) must resolve to a real App Router page
 * — otherwise it 404s silently when a user clicks it.
 *
 * Pure filesystem reads — no server, no Supabase.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveAppRoute } from "./route-manifest";

const SRC_ROOT = path.resolve(__dirname, "../..");

/** Job/RFQ surface files whose hard-coded links we hold to the no-404 contract. */
const SCAN_FILES = [
  "app/(main)/jobs/page.tsx",
  "app/(main)/post-a-job/page.tsx",
  "components/marketplace/RFQCreateForm.tsx",
  "app/(protected)/dashboard/provider/jobs/leads/page.tsx",
  "app/(protected)/dashboard/provider/quotes/page.tsx",
  "app/(protected)/dashboard/provider/quotes/builder/page.tsx",
  "components/dashboard/provider/JobLeadCard.tsx",
  "components/dashboard/provider/JobLeadsClient.tsx",
];

/** Internal app sections these surfaces may legitimately target. */
const INTERNAL_PREFIXES = [
  "/dashboard",
  "/jobs",
  "/post-a-job",
  "/login",
  "/register",
  "/signup",
  "/inbox",
  "/settings",
  "/profile",
];

function extractHrefs(src: string): string[] {
  const out: string[] = [];
  const patterns = [
    /\bhref\s*[:=]\s*\{?\s*[`"']([^`"']+)[`"']/g,
    /\b(?:router\.(?:push|replace)|redirect)\(\s*[`"']([^`"']+)[`"']/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) out.push(m[1]);
  }
  return out;
}

/** Normalise a raw href into a resolvable URL path, or null if not assertable. */
function toResolvablePath(raw: string): string | null {
  let href = raw.split("?")[0].split("#")[0];
  if (!href.startsWith("/")) return null;
  if (href.startsWith("/api") || href.startsWith("/_next")) return null;
  href = href.replace(/\$\{[^}]*\}/g, "_p_").replace(/\[[^\]]*\]/g, "_p_");
  if (href.includes("${") || href.includes("`")) return null;
  href = href.replace(/\/+$/, "") || "/";
  const isInternal = INTERNAL_PREFIXES.some(
    (p) => href === p || href.startsWith(`${p}/`),
  );
  return isInternal ? href : null;
}

describe("post-a-job link integrity", () => {
  it("every hard-coded job/RFQ href resolves to a real route", () => {
    const broken = new Map<string, Set<string>>();
    for (const rel of SCAN_FILES) {
      const src = readFileSync(path.join(SRC_ROOT, rel), "utf8");
      for (const raw of extractHrefs(src)) {
        const urlPath = toResolvablePath(raw);
        if (!urlPath) continue;
        if (resolveAppRoute(urlPath)) continue;
        if (!broken.has(urlPath)) broken.set(urlPath, new Set());
        broken.get(urlPath)!.add(rel);
      }
    }

    const report = [...broken.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([href, srcs]) => `  ${href}\n      ← ${[...srcs].sort().join(", ")}`)
      .join("\n");

    expect(
      broken.size,
      `Job/RFQ links pointing at non-existent routes (each 404s when clicked):\n${report}`,
    ).toBe(0);
  });

  it("the provider quote builder is reachable from a lead", () => {
    const card = readFileSync(
      path.join(SRC_ROOT, "components/dashboard/provider/JobLeadCard.tsx"),
      "utf8",
    );
    expect(card).toContain("/dashboard/provider/quotes/builder?request_id=");
    expect(resolveAppRoute("/dashboard/provider/quotes/builder")).toBeTruthy();
  });
});
