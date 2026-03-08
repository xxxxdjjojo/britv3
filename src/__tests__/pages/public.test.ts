import { describe, it, expect } from "vitest";

/**
 * Public pages smoke tests.
 *
 * Verify page modules export default components and are importable.
 * Full rendering tests require server component support which is
 * validated by the build step.
 */

describe("Public pages", () => {
  it("Homepage exports a default function component", async () => {
    const mod = await import("@/app/(main)/page");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("About page exports a default function component", async () => {
    const mod = await import("@/app/(main)/about/page");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("Terms page exports a default function component", async () => {
    const mod = await import("@/app/(main)/terms/page");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("Privacy page exports a default function component", async () => {
    const mod = await import("@/app/(main)/privacy/page");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("Not-found page exports a default function component", async () => {
    const mod = await import("@/app/not-found");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("Error page exports a default function component", async () => {
    const mod = await import("@/app/error");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });
});
