import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import SplashLayout from "@/app/(splash)/layout";
import { SPLASH_FOOTER } from "@/lib/coming-soon/config";

describe("SplashLayout", () => {
  it("renders the TrueDeed logo home link, footer copy, and children", () => {
    render(SplashLayout({ children: <div data-testid="kids" /> }));

    const logoLink = screen.getByRole("link", { name: /TrueDeed/i });
    expect(logoLink).toHaveAttribute("href", "/");

    expect(screen.getByText(SPLASH_FOOTER)).toBeInTheDocument();
    expect(screen.getByTestId("kids")).toBeInTheDocument();
  });
});
