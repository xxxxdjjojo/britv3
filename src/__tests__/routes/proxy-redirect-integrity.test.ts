/**
 * Middleware redirect-target integrity contract.
 *
 * Invariant: **no middleware redirect may point at a route that does not
 * exist.** When `src/proxy.ts` redirects a user to a path that has no matching
 * `page.tsx`, Next.js serves a 404 with no compile-time or lint warning — the
 * user is silently stranded. This is exactly the class of bug that stranded
 * every non-professional estate agent on the phantom `/dashboard/agent/
 * verification` route (which never existed).
 *
 * The test is self-maintaining: it derives its expectations from the proxy
 * source itself, so it keeps holding as redirect targets change and fails the
 * moment a new redirect (or a new gated role prefix) lands without its landing
 * page. It resolves every target through `resolveAppRoute` — the same App
 * Router matcher Next.js uses (literal segment preferred, then `[param]`,
 * route groups transparent).
 *
 * Pure filesystem reads — no server, no Supabase.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveAppRoute } from "./route-manifest";

const PROXY_SRC = readFileSync(
  path.resolve(__dirname, "../../proxy.ts"),
  "utf8",
);

/**
 * Extract every literal first-argument to `redirectWithHeaders(...)` where that
 * argument is a plain string literal WITHOUT a `${...}` template expression.
 * Template-built targets (`/dashboard/${role}/verification`) are covered by the
 * gate-derived assertions below instead.
 */
function literalRedirectTargets(src: string): string[] {
  const out = new Set<string>();
  const re = /redirectWithHeaders\(\s*[`"']([^`"']+)[`"']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const target = m[1];
    if (target.includes("${")) continue; // template — not a static literal
    out.add(target.split("?")[0]); // strip any query string
  }
  return [...out].sort();
}

/**
 * Pull the `/dashboard/<role>` string entries out of a named array literal in
 * the proxy source (e.g. `VERIFICATION_GATED_PREFIXES = [ ... ] as const;`).
 * Tolerant of whitespace, newlines, trailing commas, and `as const`.
 */
function gatePrefixes(src: string, name: string): string[] {
  const arrayRe = new RegExp(`${name}\\s*=\\s*\\[([\\s\\S]*?)\\]`);
  const body = src.match(arrayRe)?.[1];
  if (body == null) {
    throw new Error(`Could not locate array literal ${name} in proxy source`);
  }
  const out: string[] = [];
  const entryRe = /[`"'](\/dashboard\/[^`"']+)[`"']/g;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(body))) out.push(m[1]);
  return out;
}

describe("proxy redirect-target integrity", () => {
  it("every literal redirect target resolves to a real route", () => {
    const targets = literalRedirectTargets(PROXY_SRC);
    expect(targets.length).toBeGreaterThan(0);

    const broken = targets.filter((t) => resolveAppRoute(t) === null);
    expect(
      broken,
      `Middleware redirects at these literal targets 404 (no matching page.tsx):\n${broken
        .map((t) => `  ${t}`)
        .join("\n")}`,
    ).toEqual([]);
  });

  it("every verification-gated prefix has a /verification landing page", () => {
    const prefixes = gatePrefixes(PROXY_SRC, "VERIFICATION_GATED_PREFIXES");
    expect(prefixes.length).toBeGreaterThan(0);

    const broken = prefixes.filter(
      (prefix) => resolveAppRoute(`${prefix}/verification`) === null,
    );
    expect(
      broken,
      `These verification-gated prefixes redirect to a missing landing page ` +
        `(${broken.map((p) => `${p}/verification`).join(", ")}). Either the ` +
        `gate must not cover this role or the landing page must be created.`,
    ).toEqual([]);
  });

  it("every subscription-gated prefix has a billing checkout landing page", () => {
    const prefixes = gatePrefixes(PROXY_SRC, "SUBSCRIPTION_GATED_PREFIXES");
    expect(prefixes.length).toBeGreaterThan(0);

    const broken = prefixes.filter(
      (prefix) =>
        resolveAppRoute(`${prefix}/billing/checkout/subscription`) === null,
    );
    expect(
      broken,
      `These subscription-gated prefixes redirect to a missing checkout page ` +
        `(${broken
          .map((p) => `${p}/billing/checkout/subscription`)
          .join(", ")}).`,
    ).toEqual([]);
  });
});
