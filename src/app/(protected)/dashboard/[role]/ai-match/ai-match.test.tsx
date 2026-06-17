import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import AiMatchPage from "./page";
import type { AiMatchResult } from "@/services/ai/ai-match-service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type GetResponse = {
  preferences: null;
  results: AiMatchResult[];
  resultsExpired: boolean;
};

function mockFetchOnce(body: GetResponse) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(body),
      }),
    ),
  );
}

const sampleResult: AiMatchResult = {
  id: "r1",
  listing_id: "l1",
  match_score: 0.92,
  match_reasons: ["Within budget", "3 bedrooms as requested"],
  listing: {
    id: "l1",
    address: "The Rosewood Manor",
    price: 425000000, // pence
    bedrooms: 3,
    property_type: "Detached",
  },
} as AiMatchResult;

describe("AiMatchPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the AI Property Match heading", async () => {
    mockFetchOnce({ preferences: null, results: [], resultsExpired: false });
    render(<AiMatchPage />);
    expect(
      screen.getByRole("heading", { name: /ai property match/i }),
    ).toBeInTheDocument();
  });

  it("renders the Intelligent Selections section and the Recalibrate Matches CTA", async () => {
    mockFetchOnce({ preferences: null, results: [], resultsExpired: false });
    render(<AiMatchPage />);
    expect(
      screen.getByRole("heading", { name: /intelligent selections/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /recalibrate matches/i }).length,
    ).toBeGreaterThan(0);
  });

  it("shows the empty state when there are no matches", async () => {
    mockFetchOnce({ preferences: null, results: [], resultsExpired: false });
    render(<AiMatchPage />);
    await waitFor(() => {
      expect(screen.getByText(/no matches yet/i)).toBeInTheDocument();
    });
  });

  it("renders a match card with property name, price and match reasons", async () => {
    mockFetchOnce({
      preferences: null,
      results: [sampleResult],
      resultsExpired: false,
    });
    render(<AiMatchPage />);

    await waitFor(() => {
      expect(screen.getByText("The Rosewood Manor")).toBeInTheDocument();
    });
    expect(screen.getByText(/92% match/i)).toBeInTheDocument();
    expect(screen.getByText("Within budget")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ask ai concierge/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /schedule private viewing/i }),
    ).toBeInTheDocument();
  });
});
