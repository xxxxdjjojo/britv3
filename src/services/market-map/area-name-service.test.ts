import { describe, it, expect } from "vitest";
import { humanizeAreaSlug } from "./area-name-service";

describe("humanizeAreaSlug", () => {
  it("title-cases a hyphenated local-authority slug", () => {
    expect(humanizeAreaSlug("kensington-and-chelsea")).toBe("Kensington And Chelsea");
  });

  it("leaves an already-uppercase postcode district intact", () => {
    expect(humanizeAreaSlug("SW1A")).toBe("SW1A");
  });

  it("decodes percent-encoded segments", () => {
    expect(humanizeAreaSlug("city%20of%20london")).toBe("City Of London");
  });
});
