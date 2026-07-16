import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReferralDashboard } from "./ReferralDashboard";
import type { ReferralStats } from "@/types/referrals";

vi.mock("posthog-js", () => ({
  default: { capture: vi.fn() },
}));

const providerStates = [
  "invited",
  "signed_up",
  "gate_complete",
  "converted",
  "credited",
] as const;

function referralStats(): ReferralStats {
  return {
    referral_code: "CREW2026",
    referral_url: "https://truedeed.co.uk/join?ref=CREW2026",
    tier: "ambassador",
    successful_referrals: 3,
    pending_referrals: 2,
    total_rewards_pence: 0,
    next_tier_threshold: 5,
    credited_months: 2,
    credit_cap_used: 4,
    credit_cap_limit: 12,
    referrals: providerStates.map((providerState, index) => ({
      id: `referral-${index}`,
      referrer_id: "provider-1",
      referred_id: index === 0 ? null : `provider-${index + 1}`,
      referral_code: "CREW2026",
      track: "trade_to_trade",
      status: providerState === "credited" ? "rewarded" : "pending",
      provider_state: providerState,
      referred_name: `Crew member ${index + 1}`,
      created_at: "2026-07-01T12:00:00.000Z",
      converted_at: providerState === "converted" || providerState === "credited"
        ? "2026-07-12T12:00:00.000Z"
        : null,
    })),
  };
}

describe("ReferralDashboard", () => {
  it("shows the complete provider crew journey, one-referrer rewards, cap and accessible share actions", () => {
    render(<ReferralDashboard stats={referralStats()} />);

    expect(screen.getByRole("heading", { name: "Bring Your Crew" })).toBeInTheDocument();
    for (const label of ["Invited", "Signed up", "Gate complete", "Converted", "Credited"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    expect(screen.getByText("2 months credited")).toBeInTheDocument();
    expect(screen.getByText("4 of 12 credits used in the last 12 months")).toBeInTheDocument();
    expect(screen.getByText("Ambassador unlocked")).toBeInTheDocument();
    expect(screen.getByText(/you earn one month/i)).toBeInTheDocument();
    expect(screen.queryByText(/both.*month/i)).not.toBeInTheDocument();

    const whatsapp = screen.getByRole("link", { name: /share on whatsapp/i });
    expect(whatsapp).toHaveAttribute("href", expect.stringMatching(/^https:\/\/wa\.me\//));
    expect(screen.getByRole("link", { name: /share by sms/i })).toHaveAttribute(
      "href",
      expect.stringMatching(/^sms:/),
    );
    expect(screen.getByRole("link", { name: /share by email/i })).toHaveAttribute(
      "href",
      expect.stringMatching(/^mailto:/),
    );
    expect(screen.getByRole("button", { name: /copy referral link/i })).toHaveClass("min-h-11");
    expect(whatsapp).toHaveClass("min-h-11");
  });
});
