import { describe, it, expect } from "vitest";
import { getSuggestedReplies } from "./smart-replies";

describe("getSuggestedReplies", () => {
  it("returns viewing-related suggestions for viewing_request type", () => {
    const replies = getSuggestedReplies("viewing_request", "");
    expect(replies.length).toBeGreaterThan(0);
    expect(replies.length).toBeLessThanOrEqual(4);
    expect(replies.some((r) => r.toLowerCase().includes("viewing"))).toBe(true);
  });

  it("returns quote-related suggestions for quote_response type", () => {
    const replies = getSuggestedReplies("quote_response", "");
    expect(replies.length).toBeGreaterThan(0);
    expect(replies.length).toBeLessThanOrEqual(4);
    expect(replies.some((r) => r.toLowerCase().includes("quote") || r.toLowerCase().includes("cost"))).toBe(true);
  });

  it("returns price-related suggestions when message contains 'price' keyword", () => {
    const replies = getSuggestedReplies("general", "What is the price for this property?");
    expect(replies.length).toBeGreaterThan(0);
    expect(replies.length).toBeLessThanOrEqual(4);
    expect(replies.some((r) => r.toLowerCase().includes("price") || r.toLowerCase().includes("offer") || r.toLowerCase().includes("negotiat"))).toBe(true);
  });

  it("returns max 4 suggestions", () => {
    const replies = getSuggestedReplies("viewing_request", "I need info about the price and it's urgent");
    expect(replies.length).toBeLessThanOrEqual(4);
  });

  it("returns generic suggestions for unknown conversation type", () => {
    const replies = getSuggestedReplies("unknown_type", "");
    expect(replies.length).toBeGreaterThan(0);
    expect(replies.length).toBeLessThanOrEqual(4);
  });

  it("deduplicates suggestions", () => {
    const replies = getSuggestedReplies("general", "price price price");
    const unique = new Set(replies);
    expect(replies.length).toBe(unique.size);
  });

  it("returns offer-related suggestions for offer_discussion type", () => {
    const replies = getSuggestedReplies("offer_discussion", "");
    expect(replies.length).toBeGreaterThan(0);
    expect(replies.some((r) => r.toLowerCase().includes("offer") || r.toLowerCase().includes("price"))).toBe(true);
  });

  it("returns maintenance-related suggestions for maintenance type", () => {
    const replies = getSuggestedReplies("maintenance", "");
    expect(replies.length).toBeGreaterThan(0);
    expect(replies.some((r) => r.toLowerCase().includes("urgent") || r.toLowerCase().includes("visit") || r.toLowerCase().includes("photo"))).toBe(true);
  });
});
