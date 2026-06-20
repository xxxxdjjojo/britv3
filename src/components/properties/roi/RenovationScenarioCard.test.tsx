import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RenovationScenarioCard } from "./RenovationScenarioCard";
import type { ROIRenovation } from "@/services/properties/roi-estimation-service";

const renovation: ROIRenovation = {
  type: "loft_conversion",
  cost_low: 30000,
  cost_high: 50000,
  value_uplift_pct: 15,
  confidence: "high",
};

describe("RenovationScenarioCard feasibility badge", () => {
  it("renders a feasibility badge when feasibility is provided", () => {
    render(<RenovationScenarioCard renovation={renovation} feasibility="likely_permitted" />);
    expect(screen.getByText("Likely permitted development")).toBeInTheDocument();
  });

  it("renders no feasibility badge when feasibility is omitted", () => {
    render(<RenovationScenarioCard renovation={renovation} />);
    expect(screen.queryByText("Likely permitted development")).not.toBeInTheDocument();
    expect(screen.queryByText("Likely needs full planning")).not.toBeInTheDocument();
  });
});
