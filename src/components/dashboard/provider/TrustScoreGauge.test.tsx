import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Suppress requestAnimationFrame in happy-dom environment
vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
  cb(0);
  return 0;
});
vi.stubGlobal("cancelAnimationFrame", () => undefined);

import { TrustScoreGauge } from "./TrustScoreGauge";

describe("TrustScoreGauge", () => {
  it("renders the score value in the SVG label", () => {
    render(<TrustScoreGauge score={72} />);
    expect(
      screen.getByRole("img", { name: /trust score: 72/i }),
    ).toBeInTheDocument();
  });

  it("clamps score above 100 to 100", () => {
    render(<TrustScoreGauge score={150} />);
    expect(
      screen.getByRole("img", { name: /trust score: 100/i }),
    ).toBeInTheDocument();
  });

  it("clamps score below 0 to 0", () => {
    render(<TrustScoreGauge score={-10} />);
    expect(
      screen.getByRole("img", { name: /trust score: 0/i }),
    ).toBeInTheDocument();
  });

  it("shows the '/ 100' label", () => {
    render(<TrustScoreGauge score={50} />);
    expect(screen.getByText("/ 100")).toBeInTheDocument();
  });

  it("shows the 'Trust Score' eyebrow label", () => {
    render(<TrustScoreGauge score={50} />);
    expect(screen.getByText(/trust score/i)).toBeInTheDocument();
  });

  it("shows 'Excellent' description for high scores", () => {
    render(<TrustScoreGauge score={85} />);
    expect(screen.getByText(/excellent/i)).toBeInTheDocument();
  });

  it("shows 'Good' description for mid scores", () => {
    render(<TrustScoreGauge score={60} />);
    expect(screen.getByText(/good/i)).toBeInTheDocument();
  });

  it("shows 'Complete your profile' description for low scores", () => {
    render(<TrustScoreGauge score={20} />);
    expect(screen.getByText(/complete your profile/i)).toBeInTheDocument();
  });
});
