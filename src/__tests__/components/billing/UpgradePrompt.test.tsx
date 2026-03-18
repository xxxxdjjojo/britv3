// src/__tests__/components/billing/UpgradePrompt.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";

// Mock next/link to render as a plain anchor
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

afterEach(() => {
  cleanup();
});

describe("UpgradePrompt", () => {
  it("renders feature label and plan display name", () => {
    render(
      <UpgradePrompt
        feature="API_ACCESS"
        requiredPlanId="provider_elite"
        planDisplayName="Elite (£197/mo)"
        role="provider"
      />,
    );
    expect(screen.getByText(/upgrade to unlock api access/i)).toBeInTheDocument();
    // The plan name appears in the descriptive paragraph
    expect(screen.getByText(/This feature is available on the Elite/i)).toBeInTheDocument();
  });

  it("links to billing page for the correct role", () => {
    render(
      <UpgradePrompt
        feature="LISTINGS_UNLIMITED"
        requiredPlanId="agent_professional"
        planDisplayName="Professional (£297/mo)"
        role="agent"
      />,
    );
    const upgradeLink = screen.getByRole("link", { name: /upgrade to professional/i });
    expect(upgradeLink).toHaveAttribute("href", "/dashboard/agent/billing/checkout/subscription");
  });

  it("includes compare plans link", () => {
    render(
      <UpgradePrompt
        feature="QUOTES_UNLIMITED"
        requiredPlanId="provider_professional"
        planDisplayName="Professional (£97/mo)"
        role="provider"
      />,
    );
    expect(screen.getByRole("link", { name: /compare all plans/i })).toHaveAttribute("href", "/pricing");
  });
});
