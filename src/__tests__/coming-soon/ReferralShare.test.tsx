import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReferralShare } from "@/components/coming-soon/ReferralShare";

describe("ReferralShare", () => {
  it("renders a copy button and exposes a share url carrying the referral code", () => {
    const { container } = render(
      <ReferralShare code="ABC123XY" baseUrl="https://truedeed.co.uk" />,
    );

    expect(
      screen.getByRole("button", { name: /copy link/i }),
    ).toBeInTheDocument();

    // The share URL may live in an input value or as visible text; accept either.
    const inputWithRef = Array.from(
      container.querySelectorAll("input"),
    ).some((input) => input.value.includes("ref=ABC123XY"));
    const textHasRef = container.textContent?.includes("ref=ABC123XY") ?? false;

    expect(inputWithRef || textHasRef).toBe(true);
  });
});
