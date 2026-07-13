import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

/**
 * Accessibility smoke tests for core UI primitives.
 *
 * NOTE: vitest-axe@0.1.0 does not export `toHaveNoViolations` — it only
 * exports `axe` and `configureAxe`. Falling back to RTL accessible-role/name
 * assertions as specified in the task spec (substitution noted in PR report).
 *
 * These verify that Button renders with the correct accessible role and name,
 * that disabled state is exposed, and that link-role buttons keep link semantics.
 */

describe("Button a11y — accessible role and name", () => {
  it("default button has button role with accessible name", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("disabled button is marked as disabled", () => {
    render(<Button disabled>Disabled Action</Button>);
    const btn = screen.getByRole("button", { name: "Disabled Action" });
    expect(btn).toBeDisabled();
  });

  it("link button (asChild) has link role and accessible name", () => {
    render(
      <Button asChild>
        <a href="/go">Go somewhere</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Go somewhere" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/go");
  });

  it("button carries data-slot='button' for CSS targeting", () => {
    render(<Button>Styled</Button>);
    const btn = screen.getByRole("button", { name: "Styled" });
    expect(btn).toHaveAttribute("data-slot", "button");
  });

  it("xl size button is still a button", () => {
    render(<Button size="xl">Big CTA</Button>);
    expect(screen.getByRole("button", { name: "Big CTA" })).toBeInTheDocument();
  });
});
