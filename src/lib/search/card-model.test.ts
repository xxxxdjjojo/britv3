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
  last_sold_date: null,
};

const BASE_RENT: SearchProperty = {
  ...BASE,
  id: "2",
  slug: "flat-2b-north-st",
  price: 2200,
  beds: 3,
  baths: 1,
  listing_type: "rent",
  furnishing: "furnished",
  let_agreed: true,
};

describe("toCardModel — honest fallbacks", () => {
  it("formats a real sale price with the pound sign", () => {
    expect(toCardModel(BASE).priceLabel).toBe("£4,250,000");
  });

  it("formats a rent price with pcm suffix (not /mo)", () => {
    const model = toCardModel({ ...BASE, listing_type: "rent", price: 1850 });
    expect(model.priceLabel).toBe("£1,850 pcm");
    // must NOT contain the old /mo suffix
    expect(model.priceLabel).not.toContain("/mo");
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

describe("toCardModel — rent-specific fields", () => {
  it("marks isRent true for rent listings, false for sale", () => {
    expect(toCardModel(BASE_RENT).isRent).toBe(true);
    expect(toCardModel(BASE).isRent).toBe(false);
  });

  it("rent: priceLabel ends with 'pcm' (e.g. £2,200 pcm)", () => {
    const model = toCardModel(BASE_RENT);
    expect(model.priceLabel).toBe("£2,200 pcm");
  });

  it("rent: perWeekLabel is a '£X pw' string derived from monthly rent", () => {
    const model = toCardModel(BASE_RENT);
    // 2200 / (52/12) ≈ 507.69, rounded to 508
    expect(model.perWeekLabel).toBe("£508 pw");
  });

  it("rent with beds >= 1: perRoomLabel is '£X pcm / room'", () => {
    const model = toCardModel(BASE_RENT); // 3 beds, 2200pcm → 2200/3 = 733
    expect(model.perRoomLabel).toBe("£733 pcm / room");
  });

  it("rent studio (beds = 0): perRoomLabel is null", () => {
    const studio = toCardModel({ ...BASE_RENT, beds: 0 });
    expect(studio.perRoomLabel).toBeNull();
  });

  it("rent: furnishingLabel reflects the furnishing field", () => {
    expect(toCardModel({ ...BASE_RENT, furnishing: "furnished" }).furnishingLabel).toBe("Furnished");
    expect(toCardModel({ ...BASE_RENT, furnishing: "unfurnished" }).furnishingLabel).toBe("Unfurnished");
    expect(toCardModel({ ...BASE_RENT, furnishing: "part_furnished" }).furnishingLabel).toBe("Part furnished");
    expect(toCardModel({ ...BASE_RENT, furnishing: null }).furnishingLabel).toBeNull();
    expect(toCardModel({ ...BASE_RENT, furnishing: undefined }).furnishingLabel).toBeNull();
  });

  it("rent: isLetAgreed is true when let_agreed is true", () => {
    expect(toCardModel(BASE_RENT).isLetAgreed).toBe(true);
    expect(toCardModel({ ...BASE_RENT, let_agreed: false }).isLetAgreed).toBe(false);
    expect(toCardModel({ ...BASE_RENT, let_agreed: undefined }).isLetAgreed).toBe(false);
  });

  it("sale: perWeekLabel, perRoomLabel, furnishingLabel are all null", () => {
    const model = toCardModel(BASE);
    expect(model.perWeekLabel).toBeNull();
    expect(model.perRoomLabel).toBeNull();
    expect(model.furnishingLabel).toBeNull();
  });

  it("sale: isLetAgreed is always false", () => {
    expect(toCardModel(BASE).isLetAgreed).toBe(false);
  });

  it("sale: priceLabel has no 'pcm' or 'pw' suffix", () => {
    const model = toCardModel(BASE);
    expect(model.priceLabel).not.toContain("pcm");
    expect(model.priceLabel).not.toContain("pw");
  });

  it("rent: zero/null price still returns 'Price on application' (not pcm)", () => {
    const model = toCardModel({ ...BASE_RENT, price: 0 });
    expect(model.priceLabel).toBe("Price on application");
  });
});
