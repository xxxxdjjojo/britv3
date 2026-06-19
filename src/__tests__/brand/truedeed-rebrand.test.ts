import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { brandConfig } from "@/config/brand";
import { FOOTER_LINKS, NAV_ITEMS, ROLE_NAV_ITEMS } from "@/config/navigation";
import { resolveAppRoute } from "@/__tests__/routes/route-manifest";

const ROOT = process.cwd();

// Collect every internal href ("/...") referenced by a nav-config structure.
function collectHrefs(node: unknown, out: Set<string>): void {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const item of node) collectHrefs(item, out);
    return;
  }
  if (typeof node === "object") {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (key === "href" && typeof value === "string") out.add(value);
      else collectHrefs(value, out);
    }
  }
}

// Recursively walk a source dir, returning files matching the extension filter.
function walkSource(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "__tests__" || entry === "node_modules") continue;
      walkSource(full, acc);
    } else if (/\.(tsx?|mts)$/.test(entry) && !/\.(test|spec|stories)\./.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

describe("TrueDeed rebrand — brand identity", () => {
  it("brandConfig is TrueDeed on truedeed.co.uk", () => {
    expect(brandConfig.displayName).toBe("TrueDeed");
    expect(brandConfig.shortName).toBe("TrueDeed");
    expect(brandConfig.canonicalDomain).toBe("truedeed.co.uk");
    expect(brandConfig.canonicalUrl).toBe("https://truedeed.co.uk");
  });

  it("brandConfig exposes the @truedeed.co.uk contact map (no legacy domain)", () => {
    const emails = (brandConfig as { emails?: Record<string, string> }).emails;
    expect(emails, "brandConfig.emails contact map must exist").toBeTruthy();
    for (const key of ["hello", "support", "compliance", "privacy", "accessibility"]) {
      expect(emails?.[key], `brandConfig.emails.${key}`).toMatch(/@truedeed\.co\.uk$/);
    }
  });

  it("Logo renders the TrueDeed wordmark via brandConfig (no hard-coded Britestate)", () => {
    const src = readFileSync(join(ROOT, "src/components/shared/Logo.tsx"), "utf8");
    expect(src).not.toMatch(/Britestate/i);
    expect(src).toContain("brandConfig.displayName");
  });

  it("no user-visible source hard-codes 'Britestate' or 'britestate.co.uk'", () => {
    const dirs = ["src/app", "src/components", "src/emails", "src/lib"];
    const offenders: string[] = [];
    for (const d of dirs) {
      for (const file of walkSource(join(ROOT, d))) {
        const lines = readFileSync(file, "utf8").split("\n");
        lines.forEach((line, i) => {
          if (!/britestate/i.test(line)) return;
          // Allow internal-only identifiers that are intentionally retained.
          if (/britestate_compare/.test(line)) return; // localStorage key
          if (/@(test|demo|example)\.britestate/i.test(line)) return; // test fixtures
          offenders.push(`${relative(ROOT, file)}:${i + 1}: ${line.trim()}`);
        });
      }
    }
    expect(offenders, `legacy brand refs:\n${offenders.join("\n")}`).toEqual([]);
  });
});

describe("TrueDeed rebrand — links render & resolve", () => {
  const footerHrefs = new Set<string>();
  collectHrefs(FOOTER_LINKS, footerHrefs);
  const navHrefs = new Set<string>();
  collectHrefs(NAV_ITEMS, navHrefs);
  collectHrefs(ROLE_NAV_ITEMS, navHrefs);

  it("every internal footer link resolves to a real route on disk", () => {
    const broken: string[] = [];
    for (const href of footerHrefs) {
      if (!href.startsWith("/")) continue; // external / social
      const path = href.split(/[?#]/)[0];
      if (resolveAppRoute(path) === null) broken.push(href);
    }
    expect(broken, `broken footer links: ${broken.join(", ")}`).toEqual([]);
  });

  it("every internal nav link resolves to a real route on disk", () => {
    const broken: string[] = [];
    for (const href of navHrefs) {
      if (!href.startsWith("/")) continue;
      const path = href.split(/[?#]/)[0];
      if (resolveAppRoute(path) === null) broken.push(href);
    }
    expect(broken, `broken nav links: ${broken.join(", ")}`).toEqual([]);
  });

  it("social links point to TrueDeed handles, never Britestate", () => {
    const externals = [...footerHrefs].filter((h) => h.startsWith("http"));
    expect(externals.length, "footer should expose social links").toBeGreaterThan(0);
    for (const href of externals) {
      expect(href, `social link still references britestate: ${href}`).not.toMatch(/britestate/i);
    }
    // At least the brand social cluster should resolve to the truedeed handle.
    const social = externals.filter((h) => /twitter|x\.com|instagram|linkedin|facebook/i.test(h));
    for (const href of social) {
      expect(href, `social handle not rebranded: ${href}`).toMatch(/truedeed/i);
    }
  });
});
