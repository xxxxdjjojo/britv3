import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AgencyHero from "@/components/agents/AgencyHero";
import type { AgentPublicProfile, AgentPublicStats } from "@/types/providers";

const AGENCY = {
  id: "agency-1",
  display_name: "Kingsley & Co Estate Agents",
  areas_covered: ["Ealing"],
  phone: "020 7946 0100",
  agency: null,
} as unknown as AgentPublicProfile;

const STATS = {
  avg_rating: 4.7,
  total_reviews: 88,
} as unknown as AgentPublicStats;

describe("AgencyHero — Contact Agent CTA", () => {
  it("renders Contact Agent as a working link to the enquiry card (not a dead button)", () => {
    render(<AgencyHero agency={AGENCY} stats={STATS} />);
    const cta = screen.getByRole("link", { name: /contact agent/i });
    expect(cta).toHaveAttribute("href", "#agent-enquiry");
  });

  it("no longer renders a dead Follow button", () => {
    render(<AgencyHero agency={AGENCY} stats={STATS} />);
    expect(screen.queryByRole("button", { name: /follow/i })).not.toBeInTheDocument();
  });
});
