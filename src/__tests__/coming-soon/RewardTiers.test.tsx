import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { REWARD_TIERS } from "@/lib/coming-soon/config";
import { RewardTiers } from "@/components/coming-soon/RewardTiers";

describe("RewardTiers", () => {
  it("renders every reward tier label", () => {
    render(<RewardTiers />);

    for (const tier of REWARD_TIERS) {
      expect(screen.getByText(tier.label)).toBeInTheDocument();
    }
  });
});
