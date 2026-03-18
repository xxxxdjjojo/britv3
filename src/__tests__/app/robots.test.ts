import { describe, it, expect } from "vitest";
import robots from "@/app/robots";

describe("robots.ts", () => {
  it("returns an object with rules, sitemap, and host", () => {
    const result = robots();
    expect(result).toHaveProperty("rules");
    expect(result).toHaveProperty("sitemap");
    expect(result).toHaveProperty("host");
  });

  it("allows all paths for * user agent", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const wildcardRule = rules.find((r) => r.userAgent === "*");
    expect(wildcardRule).toBeDefined();
    expect(wildcardRule!.allow).toBe("/");
  });

  it("disallows all protected routes", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const wildcardRule = rules.find((r) => r.userAgent === "*");
    const disallow = wildcardRule!.disallow as string[];
    expect(disallow).toContain("/dashboard/*");
    expect(disallow).toContain("/api/*");
    expect(disallow).toContain("/admin/*");
    expect(disallow).toContain("/settings/*");
    expect(disallow).toContain("/inbox/*");
  });

  it("includes sitemap URL ending with /sitemap.xml", () => {
    const result = robots();
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/);
  });

  it("includes host as the site URL", () => {
    const result = robots();
    expect(result.host).toBe("https://britestate.co.uk");
  });
});
