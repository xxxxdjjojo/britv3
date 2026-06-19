import { describe, it, expect } from "vitest";
import { resolveSafeNext } from "@/lib/auth/safe-redirect";

describe("resolveSafeNext (OAuth callback open-redirect guard)", () => {
  it("allows same-origin internal paths (incl. deep links + query)", () => {
    expect(resolveSafeNext("/dashboard")).toBe("/dashboard");
    expect(resolveSafeNext("/search?q=x")).toBe("/search?q=x");
    expect(resolveSafeNext("/register/onboarding/agent")).toBe(
      "/register/onboarding/agent",
    );
    expect(resolveSafeNext("/settings")).toBe("/settings");
    expect(resolveSafeNext("/two-factor")).toBe("/two-factor");
    // Privileged paths are allowed through — RBAC in the proxy still gates them.
    expect(resolveSafeNext("/admin")).toBe("/admin");
  });

  it("rejects protocol-relative and backslash host tricks", () => {
    expect(resolveSafeNext("//evil.com")).toBe("/dashboard");
    expect(resolveSafeNext("/\\evil.com")).toBe("/dashboard");
    expect(resolveSafeNext("/\\evil.com/login")).toBe("/dashboard");
    expect(resolveSafeNext("/ \\evil.com")).toBe("/dashboard");
  });

  it("rejects absolute external URLs and non-path inputs", () => {
    expect(resolveSafeNext("https://evil.com")).toBe("/dashboard");
    expect(resolveSafeNext("evil.com")).toBe("/dashboard");
    expect(resolveSafeNext("")).toBe("/dashboard");
    expect(resolveSafeNext(null)).toBe("/dashboard");
  });

  it("rejects whitespace/control characters used to smuggle a host", () => {
    expect(resolveSafeNext("/foo\tbar")).toBe("/dashboard");
    expect(resolveSafeNext(`/foo${String.fromCharCode(0)}bar`)).toBe("/dashboard");
  });
});
