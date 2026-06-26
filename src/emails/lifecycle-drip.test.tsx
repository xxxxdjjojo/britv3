import { describe, expect, it } from "vitest";
import { render } from "@react-email/components";
import { LifecycleDripEmail } from "./lifecycle-drip";

describe("LifecycleDripEmail", () => {
  const baseProps = {
    heading: "Welcome to TrueDeed",
    paragraphs: ["First line of value.", "Second line of value."],
    ctaLabel: "Start your search",
    ctaHref: "https://truedeed.co.uk/search?listingType=rent",
    previewText: "Set a saved search and get instant alerts.",
    unsubscribeUrl: "https://truedeed.co.uk/unsubscribe?token=abc",
  };

  it("renders heading, paragraphs, CTA and unsubscribe link", async () => {
    const html = await render(LifecycleDripEmail(baseProps));

    expect(html).toContain("Welcome to TrueDeed");
    expect(html).toContain("First line of value.");
    expect(html).toContain("Second line of value.");
    expect(html).toContain("Start your search");
    expect(html).toContain("https://truedeed.co.uk/search?listingType=rent");
    // Unsubscribe link is present (PECR requirement).
    expect(html).toContain("https://truedeed.co.uk/unsubscribe?token=abc");
    expect(html).toContain("Unsubscribe");
  });

  it("greets by first name when provided", async () => {
    const html = await render(LifecycleDripEmail({ ...baseProps, firstName: "Sam" }));
    expect(html).toContain("Hi Sam,");
  });

  it("falls back to a generic greeting without a first name", async () => {
    const html = await render(LifecycleDripEmail(baseProps));
    expect(html).toContain("Hi there,");
  });
});
