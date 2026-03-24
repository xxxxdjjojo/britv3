import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChainRiskBadge } from "@/components/dashboard/agent/sales/ChainRiskBadge";
import type { ChainRiskScore } from "@/types/agent";

const mockScore: ChainRiskScore = {
  id: "1", progression_id: "p1", chain_group_id: "g1",
  risk_level: "high", risk_score: 55, chain_length: 4, chain_position: 2,
  slowest_link_id: "p3", slowest_link_days: 16,
  factors: [], computed_at: "", created_at: "", updated_at: "",
};

describe("ChainRiskBadge", () => {
  it("renders risk level text", () => {
    render(<ChainRiskBadge risk={mockScore} />);
    expect(screen.getByText(/high/i)).toBeDefined();
  });
  it("shows chain length in title", () => {
    render(<ChainRiskBadge risk={mockScore} />);
    const badge = screen.getByTitle(/4 links/i);
    expect(badge).toBeDefined();
  });
});
