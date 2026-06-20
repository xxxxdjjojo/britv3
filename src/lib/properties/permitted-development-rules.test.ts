import { describe, it, expect } from "vitest";
import {
  assessPermittedDevelopment,
  roiTypeToPdScenario,
  PD_SCENARIO_ORDER,
} from "./permitted-development-rules";

describe("assessPermittedDevelopment", () => {
  const houseTypes = ["detached", "semi_detached", "terraced", "cottage", "bungalow"];
  const nonApplicableTypes = ["flat", "maisonette", "studio", "penthouse", "land", "other"];

  it.each(houseTypes)("marks %s as applicable with all scenarios", (type) => {
    const result = assessPermittedDevelopment(type);
    expect(result.applicable).toBe(true);
    expect(result.scenarios).toHaveLength(PD_SCENARIO_ORDER.length);
    expect(result.headline.length).toBeGreaterThan(0);
  });

  it.each(nonApplicableTypes)("marks %s as not applicable with no scenarios", (type) => {
    const result = assessPermittedDevelopment(type);
    expect(result.applicable).toBe(false);
    expect(result.scenarios).toEqual([]);
    expect(result.headline.length).toBeGreaterThan(0);
  });

  it("returns not applicable for an unknown property type", () => {
    const result = assessPermittedDevelopment("spaceship");
    expect(result.applicable).toBe(false);
    expect(result.scenarios).toEqual([]);
  });

  it("every applicable scenario has a non-empty label and note", () => {
    for (const scenario of assessPermittedDevelopment("detached").scenarios) {
      expect(scenario.label.length).toBeGreaterThan(0);
      expect(scenario.note.length).toBeGreaterThan(0);
    }
  });

  it("marks side return as needs_full_planning for terraced but likely_permitted for detached", () => {
    const terraced = assessPermittedDevelopment("terraced").scenarios.find(
      (s) => s.scenario === "side_return",
    );
    const detached = assessPermittedDevelopment("detached").scenarios.find(
      (s) => s.scenario === "side_return",
    );
    expect(terraced?.feasibility).toBe("needs_full_planning");
    expect(detached?.feasibility).toBe("likely_permitted");
  });
});

describe("roiTypeToPdScenario", () => {
  it("maps known ROI renovation types to PD scenarios", () => {
    expect(roiTypeToPdScenario("loft_conversion")).toBe("loft_dormer");
    expect(roiTypeToPdScenario("extension")).toBe("rear_extension");
  });

  it("returns null for ROI types with no PD scenario", () => {
    expect(roiTypeToPdScenario("kitchen")).toBeNull();
    expect(roiTypeToPdScenario("anything_else")).toBeNull();
  });
});
