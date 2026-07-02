import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PledgeArticle } from "@/components/pledges/PledgeArticle";
import { getPledge } from "@/config/pledges";

const trackPledgeViewed = vi.fn();
vi.mock("@/lib/analytics/influence-events", () => ({
  trackPledgeViewed: (slug: string) => trackPledgeViewed(slug),
}));

describe("PledgeArticle", () => {
  const pledge = getPledge("no-premium-placement")!;

  it("renders the pledge sections from the config object", () => {
    render(<PledgeArticle pledge={pledge} />);

    // The pledge — one sentence, big
    expect(
      screen.getByRole("heading", { level: 1, name: pledge.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(pledge.oneSentence)).toBeInTheDocument();

    // Section headings
    expect(
      screen.getByRole("heading", { name: "What it binds us to" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "How to verify we keep it" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Changelog" }),
    ).toBeInTheDocument();

    // Every config bullet renders
    for (const item of pledge.whatItBindsUsTo) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
    for (const item of pledge.howToVerify) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
    for (const entry of pledge.changelog) {
      expect(screen.getByText(entry.change)).toBeInTheDocument();
      expect(screen.getByText(entry.date)).toBeInTheDocument();
    }
  });

  it("fires the pledge_viewed KPI event on mount", () => {
    trackPledgeViewed.mockClear();
    render(<PledgeArticle pledge={pledge} />);
    expect(trackPledgeViewed).toHaveBeenCalledWith("no-premium-placement");
  });
});
