import { describe, it, expect } from "vitest";

/**
 * ActionSidebar — logic tests for badge derivation and data mapping.
 * Component rendering tests would require @testing-library/react with QueryClientProvider.
 * These unit tests verify the pure logic extracted from the component.
 */

// ---------------------------------------------------------------------------
// Badge logic (mirrors InboxList ConversationRow badge derivation)
// ---------------------------------------------------------------------------

type ContextType = "listing" | "booking" | "rfq" | "general";

function deriveBadge(contextType: ContextType) {
  if (contextType === "rfq") return { label: "Quote Request", className: "text-on-secondary-container bg-secondary-container" };
  if (contextType === "booking") return { label: "Viewing", className: "text-info bg-info-light" };
  if (contextType === "listing") return { label: "Property Enquiry", className: "text-white bg-brand-primary" };
  return null;
}

describe("deriveBadge", () => {
  it("returns Quote Request for rfq", () => {
    expect(deriveBadge("rfq")).toEqual(expect.objectContaining({ label: "Quote Request" }));
  });

  it("returns Viewing for booking", () => {
    expect(deriveBadge("booking")).toEqual(expect.objectContaining({ label: "Viewing" }));
  });

  it("returns Property Enquiry for listing", () => {
    expect(deriveBadge("listing")).toEqual(expect.objectContaining({ label: "Property Enquiry" }));
  });

  it("returns null for general", () => {
    expect(deriveBadge("general")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// ActionSidebar data resolution logic
// ---------------------------------------------------------------------------

function resolveIsListing(contextType: ContextType, contextId: string | null) {
  return contextType === "listing" && Boolean(contextId);
}

describe("resolveIsListing", () => {
  it("returns true for listing with contextId", () => {
    expect(resolveIsListing("listing", "abc-123")).toBe(true);
  });

  it("returns false for listing with null contextId", () => {
    expect(resolveIsListing("listing", null)).toBe(false);
  });

  it("returns false for general context type", () => {
    expect(resolveIsListing("general", "abc-123")).toBe(false);
  });

  it("returns false for rfq context type", () => {
    expect(resolveIsListing("rfq", "abc-123")).toBe(false);
  });

  it("returns false for booking context type", () => {
    expect(resolveIsListing("booking", "abc-123")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Property facts filtering logic
// ---------------------------------------------------------------------------

type PropertyData = {
  square_footage: number | null;
  epc_rating: string | null;
  tenure: string | null;
  price: number | null;
};

function derivePropertyFacts(property: PropertyData) {
  return [
    { label: "Square Footage", value: property.square_footage ? `${property.square_footage.toLocaleString()} sq ft` : null },
    { label: "Tenure", value: property.tenure },
  ].filter((f) => f.value);
}

describe("derivePropertyFacts", () => {
  it("includes both facts when both present", () => {
    const facts = derivePropertyFacts({ square_footage: 4200, epc_rating: "A", tenure: "Freehold", price: 485000 });
    expect(facts).toHaveLength(2);
    expect(facts[0].value).toBe("4,200 sq ft");
    expect(facts[1].value).toBe("Freehold");
  });

  it("filters out null square_footage", () => {
    const facts = derivePropertyFacts({ square_footage: null, epc_rating: null, tenure: "Leasehold", price: null });
    expect(facts).toHaveLength(1);
    expect(facts[0].label).toBe("Tenure");
  });

  it("filters out null tenure", () => {
    const facts = derivePropertyFacts({ square_footage: 1500, epc_rating: null, tenure: null, price: null });
    expect(facts).toHaveLength(1);
    expect(facts[0].label).toBe("Square Footage");
  });

  it("returns empty array when all null", () => {
    const facts = derivePropertyFacts({ square_footage: null, epc_rating: null, tenure: null, price: null });
    expect(facts).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Price formatting
// ---------------------------------------------------------------------------

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(price);
}

describe("formatPrice", () => {
  it("formats UK property prices correctly", () => {
    expect(formatPrice(485000)).toBe("£485,000");
  });

  it("handles millions", () => {
    expect(formatPrice(4850000)).toBe("£4,850,000");
  });

  it("handles zero", () => {
    expect(formatPrice(0)).toBe("£0");
  });
});
