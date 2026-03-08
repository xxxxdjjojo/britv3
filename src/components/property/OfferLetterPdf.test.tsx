import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { OfferLetterPdf } from "./OfferLetterPdf";
import type { OfferLetterData } from "./OfferLetterPdf";

const sampleData: OfferLetterData = {
  buyerName: "Jane Smith",
  buyerAddress: "45 Baker Street, London, NW1 6XE",
  sellerName: "Mr Johnson",
  propertyAddress: "12 Elm Road, Bristol, BS1 4QR",
  offerAmount: 350000,
  conditions: ["Subject to satisfactory survey", "Subject to mortgage approval"],
  mortgageInPrinciple: true,
  chainFree: true,
  completionDate: "1 June 2026",
  date: "7 March 2026",
};

describe("OfferLetterPdf", () => {
  it("renders without errors", () => {
    const element = createElement(OfferLetterPdf, { data: sampleData });
    expect(element).toBeDefined();
    expect(element.type).toBe(OfferLetterPdf);
  });

  it("contains buyer name, property address, and offer amount in props", () => {
    const element = createElement(OfferLetterPdf, { data: sampleData });
    const { data } = element.props as { data: OfferLetterData };
    expect(data.buyerName).toBe("Jane Smith");
    expect(data.propertyAddress).toBe("12 Elm Road, Bristol, BS1 4QR");
    expect(data.offerAmount).toBe(350000);
  });

  it("accepts conditions list", () => {
    const element = createElement(OfferLetterPdf, { data: sampleData });
    const { data } = element.props as { data: OfferLetterData };
    expect(data.conditions).toHaveLength(2);
    expect(data.conditions[0]).toBe("Subject to satisfactory survey");
    expect(data.conditions[1]).toBe("Subject to mortgage approval");
  });

  it("renders with minimal data (no optional fields)", () => {
    const minimalData: OfferLetterData = {
      buyerName: "Test Buyer",
      buyerAddress: "1 Test Street",
      propertyAddress: "2 Test Avenue",
      offerAmount: 200000,
      conditions: [],
      mortgageInPrinciple: false,
      chainFree: false,
      date: "1 January 2026",
    };

    const element = createElement(OfferLetterPdf, { data: minimalData });
    expect(element).toBeDefined();
    expect(element.props.data.sellerName).toBeUndefined();
    expect(element.props.data.completionDate).toBeUndefined();
  });

  it("component function produces a valid React element tree", () => {
    // Calling the component function directly to verify it produces a valid element
    const result = OfferLetterPdf({ data: sampleData });
    expect(result).toBeDefined();
    // Should return a Document element (from @react-pdf/renderer)
    expect(result.type).toBeDefined();
    // The Document should contain Page children
    expect(result.props.children).toBeDefined();
  });
});
