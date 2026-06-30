import { describe, expect, it } from "vitest";

import { categoryFromSlug, categoryLabel, slugForCategory, townFromSlug, townSlug } from "./category-slugs";

describe("category slugs", () => {
  it("maps friendly plural slugs to service categories", () => {
    expect(categoryFromSlug("plumbers")).toBe("plumber");
    expect(categoryFromSlug("conveyancers")).toBe("conveyancing");
    expect(categoryFromSlug("mortgage-brokers")).toBe("mortgage_broker");
  });

  it("returns null for an unknown slug", () => {
    expect(categoryFromSlug("astronauts")).toBeNull();
  });

  it("round-trips a category to its slug", () => {
    expect(slugForCategory("plumber")).toBe("plumbers");
    expect(categoryFromSlug(slugForCategory("mortgage_broker"))).toBe("mortgage_broker");
  });

  it("produces a human label", () => {
    expect(categoryLabel("plumber")).toBe("Plumbers");
    expect(categoryLabel("mortgage_broker")).toBe("Mortgage Brokers");
  });
});

describe("town slugs", () => {
  it("slugifies and de-slugifies a town name", () => {
    expect(townSlug("Ealing")).toBe("ealing");
    expect(townSlug("Milton Keynes")).toBe("milton-keynes");
    expect(townFromSlug("milton-keynes")).toBe("Milton Keynes");
  });
});
