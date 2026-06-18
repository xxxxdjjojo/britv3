import { describe, it, expect } from "vitest";
import { toCardModel } from "./card-model";
import type { SearchProperty } from "@/app/(main)/search/actions";

const BASE: SearchProperty = {
  id: "1",
  slug: "the-glass-pavilion",
  image: "/images/properties/property-1.jpg",
  price: 4250000,
  address: "1 High Street",
  city: "Chipping Norton",
  postcode: "OX7 5AD",
  beds: 5,
  baths: 4,
  sqft: 4200,
  type: "Detached",
  listing_type: "sale",
  lat: 51.9,
  lng: -1.5,
  epc_rating: "B",
  tenure: "freehold",
};

describe("toCardModel — honest fallbacks", () => {
  it("formats a real sale price with the pound sign", () => {
    expect(toCardModel(BASE).priceLabel).toBe("£4,250,000");
  });

  it("formats a rent price with a /mo suffix", () => {
    const model = toCardModel({ ...BASE, listing_type: "rent", price: 1850 });
    expect(model.priceLabel).toBe("£1,850/mo");
  });

  it("shows 'Price on application' when price is null or zero", () => {
    expect(toCardModel({ ...BASE, price: 0 }).priceLabel).toBe("Price on application");
    // Guard against a null leaking in from the DB layer
    expect(
      toCardModel({ ...BASE, price: null as unknown as number }).priceLabel,
    ).toBe("Price on application");
  });

  it("omits the sqft label when floor area is unavailable", () => {
    expect(toCardModel({ ...BASE, sqft: 0 }).sqftLabel).toBeNull();
    expect(
      toCardModel({ ...BASE, sqft: null as unknown as number }).sqftLabel,
    ).toBeNull();
  });

  it("formats a real sqft value", () => {
    expect(toCardModel(BASE).sqftLabel).toBe("4,200 sqft");
  });

  it("flags a missing image so the card can show a placeholder", () => {
    expect(toCardModel({ ...BASE, image: null }).hasImage).toBe(false);
    expect(toCardModel(BASE).hasImage).toBe(true);
  });

  it("links the card to the real property route via slug", () => {
    expect(toCardModel(BASE).href).toBe("/properties/the-glass-pavilion");
  });

  it("renders a non-link (null href) when the slug is missing", () => {
    expect(toCardModel({ ...BASE, slug: "" }).href).toBeNull();
  });

  it("builds a human location string", () => {
    expect(toCardModel(BASE).locationLabel).toBe("Chipping Norton, OX7 5AD");
  });

  it("never fabricates a Verified badge — only true when the source says so", () => {
    expect(toCardModel(BASE).isVerified).toBe(false);
    expect(toCardModel({ ...BASE, verified: true } as SearchProperty & { verified: boolean }).isVerified).toBe(true);
  });
});
