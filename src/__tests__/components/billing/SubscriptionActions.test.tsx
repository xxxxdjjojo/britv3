// src/__tests__/components/billing/SubscriptionActions.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SubscriptionActions } from "@/components/billing/SubscriptionActions";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

afterEach(() => {
  cleanup();
});

describe("SubscriptionActions", () => {
  const defaultProps = {
    role: "agent",
    basePath: "/dashboard/agent/billing",
    returnUrl: "/dashboard/agent/billing/subscription",
  } as const;

  it("renders the portal button with correct label", () => {
    render(<SubscriptionActions {...defaultProps} />);
    expect(screen.getByRole("button", { name: /manage via stripe/i })).toBeInTheDocument();
  });

  it("portal button is enabled by default", () => {
    render(<SubscriptionActions {...defaultProps} />);
    expect(screen.getByRole("button", { name: /manage via stripe/i })).not.toBeDisabled();
  });
});
