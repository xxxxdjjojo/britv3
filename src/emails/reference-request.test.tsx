import { describe, expect, it } from "vitest";
import { render } from "@react-email/components";
import { ReferenceRequestEmail } from "./reference-request";

describe("ReferenceRequestEmail", () => {
  const baseProps = {
    refereeName: "Jordan",
    providerName: "Alex Smith",
    providerTrade: "Plumber",
    referenceType: "client" as const,
    relationship: "past customer",
    submissionUrl: "https://truedeed.co.uk/reference/raw-token-abc123",
    expiresAt: "2026-08-11T00:00:00.000Z",
  };

  it("renders the provider name, submission URL and CTA", async () => {
    const html = await render(ReferenceRequestEmail(baseProps));

    expect(html).toContain("Alex Smith");
    expect(html).toContain("Plumber");
    expect(html).toContain("https://truedeed.co.uk/reference/raw-token-abc123");
    expect(html).toContain("Provide your reference");
    expect(html).toContain("Jordan");
  });

  it("uses customer wording for a client reference", async () => {
    const html = await render(ReferenceRequestEmail(baseProps));
    expect(html).toContain("customer");
    expect(html).toContain("has asked you for a reference");
  });

  it("uses professional wording for a peer reference", async () => {
    const html = await render(
      ReferenceRequestEmail({ ...baseProps, referenceType: "peer" }),
    );
    expect(html).toContain("professional");
  });

  it("uses reminder copy that differs from the initial email", async () => {
    const initial = await render(ReferenceRequestEmail(baseProps));
    const reminder = await render(
      ReferenceRequestEmail({ ...baseProps, isReminder: true }),
    );

    expect(reminder).toContain("Reminder:");
    expect(reminder).not.toBe(initial);
    expect(initial).not.toContain("Reminder:");
    // Both still link to the same submission URL.
    expect(reminder).toContain("https://truedeed.co.uk/reference/raw-token-abc123");
  });

  it("shows a human-friendly expiry date", async () => {
    const html = await render(ReferenceRequestEmail(baseProps));
    // 2026-08-11 in en-GB long format.
    expect(html).toContain("August");
    expect(html).toContain("2026");
  });
});
