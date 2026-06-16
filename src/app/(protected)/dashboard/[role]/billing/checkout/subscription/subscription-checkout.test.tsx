import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mock next/navigation — useSearchParams, useParams
// ---------------------------------------------------------------------------
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: () => null,
    has: () => false,
  }),
  useParams: () => ({ role: "agent" }),
}));

// ---------------------------------------------------------------------------
// Mock PlanGrid — avoids pulling in Stripe + billing-config client-side deps
// ---------------------------------------------------------------------------
vi.mock("@/components/billing/PlanGrid", () => ({
  PlanGrid: () => <div data-testid="plan-grid" />,
}));

// ---------------------------------------------------------------------------
// Mock Stripe — loadStripe is called at module level
// ---------------------------------------------------------------------------
vi.mock("@stripe/react-stripe-js", () => ({
  EmbeddedCheckout: () => null,
  EmbeddedCheckoutProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@stripe/stripe-js", () => ({
  loadStripe: () => Promise.resolve(null),
}));

// ---------------------------------------------------------------------------
// Stub fetch so usePlans resolves immediately with an empty list
// ---------------------------------------------------------------------------
vi.stubGlobal("fetch", () =>
  Promise.resolve({ json: () => Promise.resolve({ plans: [] }) } as Response),
);

import SubscriptionCheckoutPage from "./page";

describe("SubscriptionCheckoutPage — plan selection view", () => {
  it("renders the editorial eyebrow above the heading", async () => {
    render(<SubscriptionCheckoutPage />);

    // The eyebrow and heading render synchronously (no clientSecret present)
    expect(
      await screen.findByText("Subscription Management"),
    ).toBeInTheDocument();
  });

  it("renders the plan heading text unchanged", async () => {
    render(<SubscriptionCheckoutPage />);
    expect(await screen.findByRole("heading", { name: /choose your plan/i })).toBeInTheDocument();
  });

  it("renders the PlanGrid", async () => {
    render(<SubscriptionCheckoutPage />);
    expect(await screen.findByTestId("plan-grid")).toBeInTheDocument();
  });

  it("renders the commission disclaimer text unchanged", async () => {
    render(<SubscriptionCheckoutPage />);
    expect(
      await screen.findByText(/2\.5% platform commission/),
    ).toBeInTheDocument();
  });

  it("renders the skip link unchanged", async () => {
    render(<SubscriptionCheckoutPage />);
    expect(
      await screen.findByRole("link", { name: /skip for now/i }),
    ).toBeInTheDocument();
  });
});
