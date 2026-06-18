import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { resolveAppRoute } from "../../../../../__tests__/routes/route-manifest";

// BUG F1: the provider layout redirected to "/onboarding/provider" on a
// resolveProviderId failure, but no such route exists. The real onboarding
// route is "/register/onboarding/provider". These assertions guard the
// redirect target against the real app tree without running the server.
const layoutSource = readFileSync(
  path.resolve(__dirname, "../layout.tsx"),
  "utf8",
);

describe("provider onboarding redirect target", () => {
  it("resolves the real onboarding route", () => {
    expect(resolveAppRoute("/register/onboarding/provider")).not.toBeNull();
  });

  it("does not resolve the dead onboarding route", () => {
    expect(resolveAppRoute("/onboarding/provider")).toBeNull();
  });

  it("redirects to a route that actually exists", () => {
    const match = layoutSource.match(/redirect\("(\/[^"]*onboarding[^"]*)"\)/);
    expect(match).not.toBeNull();
    const target = match![1];
    expect(resolveAppRoute(target)).not.toBeNull();
  });
});
