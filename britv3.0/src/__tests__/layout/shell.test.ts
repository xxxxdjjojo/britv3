import { describe, it, expect } from "vitest";

/**
 * Layout shell smoke tests.
 *
 * These are compile-time / import-level tests to verify the layout
 * components export correctly and are importable. Full rendering tests
 * require the client environment which is validated by the build step.
 */

describe("Layout shell components", () => {
  it("Header exports a named function component", async () => {
    const mod = await import("@/components/layout/Header");
    expect(mod.Header).toBeDefined();
    expect(typeof mod.Header).toBe("function");
  });

  it("Footer exports a named function component", async () => {
    const mod = await import("@/components/layout/Footer");
    expect(mod.Footer).toBeDefined();
    expect(typeof mod.Footer).toBe("function");
  });

  it("MobileNav exports a named function component", async () => {
    const mod = await import("@/components/layout/MobileNav");
    expect(mod.MobileNav).toBeDefined();
    expect(typeof mod.MobileNav).toBe("function");
  });

  it("Logo exports a named function component", async () => {
    const mod = await import("@/components/shared/Logo");
    expect(mod.Logo).toBeDefined();
    expect(typeof mod.Logo).toBe("function");
  });

  it("LoadingSpinner exports a named function component", async () => {
    const mod = await import("@/components/shared/LoadingSpinner");
    expect(mod.LoadingSpinner).toBeDefined();
    expect(typeof mod.LoadingSpinner).toBe("function");
  });
});
