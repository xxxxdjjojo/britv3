import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HEADLINE_VARIANTS } from "@/components/coming-soon/variants";
import { ComingSoonContent } from "@/components/coming-soon/ComingSoonContent";

describe("ComingSoonContent", () => {
  it("renders the variant headline and call-to-action", () => {
    const variant = HEADLINE_VARIANTS.B;
    render(<ComingSoonContent variant={variant} />);

    expect(
      screen.getByRole("heading", { name: variant.headline }),
    ).toBeInTheDocument();
    expect(screen.getByText(variant.cta)).toBeInTheDocument();
  });
});
