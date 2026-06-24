import { describe, expect, it } from "vitest";
import { resolveAppRoute } from "@/__tests__/routes/route-manifest";

describe("coming-soon routes exist on disk", () => {
  it("resolves the /coming-soon splash page", () => {
    expect(resolveAppRoute("/coming-soon")).not.toBeNull();
  });

  it("resolves the /queue referral page", () => {
    expect(resolveAppRoute("/queue")).not.toBeNull();
  });
});
