import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "@/components/coming-soon/ProgressBar";
import { REWARD_TIERS } from "@/lib/coming-soon/config";

describe("ProgressBar", () => {
  it("counts referrals toward the next unreached tier", () => {
    render(<ProgressBar referralCount={1} />);

    const next = REWARD_TIERS[0];
    expect(
      screen.getByText(
        `1 of ${next.referrals} referrals until ${next.label}`,
      ),
    ).toBeInTheDocument();
  });

  it("advances to the following tier once one is cleared", () => {
    render(<ProgressBar referralCount={3} />);

    const next = REWARD_TIERS[1];
    expect(
      screen.getByText(
        `3 of ${next.referrals} referrals until ${next.label}`,
      ),
    ).toBeInTheDocument();
  });

  it("reports all rewards unlocked past the top tier", () => {
    render(<ProgressBar referralCount={30} />);

    expect(
      screen.getByText(/every reward unlocked/i),
    ).toBeInTheDocument();
  });
});
