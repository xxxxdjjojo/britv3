import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

// Recharts' ResponsiveContainer measures a real layout — stub the chart.
vi.mock("@/components/reports/GapBarChart", () => ({
  GapBarChart: ({ rows }: { rows: ReadonlyArray<{ label: string }> }) => (
    <div data-testid="gap-bar-chart">{rows.map((r) => r.label).join(",")}</div>
  ),
}));

vi.mock("@/services/reports/reality-gap-service", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getRealityGapEdition: vi.fn(),
}));

import {
  buildRealityGapEdition,
  getRealityGapEdition,
  type RealityGapEditionResult,
} from "@/services/reports/reality-gap-service";
import RealityGapReportPage from "./page";

const mockGet = vi.mocked(getRealityGapEdition);

type RawRow = Parameters<typeof buildRealityGapEdition>[0][number];

function rawRow(overrides: Partial<RawRow> = {}): RawRow {
  return {
    period: "2026-Q2",
    area_level: "national",
    area_id: "uk",
    area_name: "United Kingdom",
    property_type: "all",
    tier: "area_median",
    median_asking_pounds: 315000,
    median_sold_pounds: 300000,
    gap_pct: 5.2,
    sample_asking_n: 250,
    sample_sold_n: 900000,
    suppressed: false,
    methodology_version: 1,
    refreshed_at: "2026-07-02T10:00:00Z",
    ...overrides,
  };
}

const FIXTURE_ROWS = [
  rawRow(),
  // matched_pair national 'all' — suppressed (4 pairs, threshold is 10)
  rawRow({
    tier: "matched_pair",
    gap_pct: null,
    median_asking_pounds: null,
    median_sold_pounds: null,
    sample_asking_n: 4,
    sample_sold_n: 4,
    suppressed: true,
  }),
  rawRow({
    area_level: "district",
    area_id: "ealing",
    area_name: "Ealing",
    gap_pct: 1.1,
    sample_asking_n: 40,
    sample_sold_n: 400,
  }),
  rawRow({
    area_level: "district",
    area_id: "leeds",
    area_name: "Leeds",
    gap_pct: 7.9,
    sample_asking_n: 55,
    sample_sold_n: 610,
  }),
];

function editionResult(): RealityGapEditionResult {
  const edition = buildRealityGapEdition(FIXTURE_ROWS);
  return {
    edition,
    period: "2026-Q2",
    availablePeriods: ["2026-Q2", "2026-Q1"],
    rows: [],
  };
}

async function renderPage(params: { edition?: string; preview?: string } = {}) {
  const page = await RealityGapReportPage({
    searchParams: Promise.resolve(params),
  });
  return render(page);
}

describe("/reports/reality-gap page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(editionResult());
  });

  it("renders the hero with the national area-median gap", async () => {
    await renderPage();
    expect(
      screen.getByRole("heading", { level: 1, name: "The Reality Gap" }),
    ).toBeInTheDocument();
    // Hero figure plus the "All properties" stat row both show the gap.
    expect(screen.getAllByText("+5.2%").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/National asking vs sold gap — 2026-Q2/)).toBeInTheDocument();
  });

  it("renders both tier sections, clearly separated", async () => {
    await renderPage();
    expect(
      screen.getByRole("heading", { name: /Matched pairs — the same property/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Area medians — what.s asked vs what sold/ }),
    ).toBeInTheDocument();
  });

  it("renders suppressed rows as the suppression line, never a number", async () => {
    await renderPage();
    expect(
      screen.getByText(/suppressed — sample below threshold \(n=4\)/),
    ).toBeInTheDocument();
  });

  it("emits Dataset JSON-LD for the edition", async () => {
    const { container } = await renderPage();
    const blob = Array.from(
      container.querySelectorAll('script[type="application/ld+json"]'),
    )
      .map((s) => s.innerHTML)
      .join("\n");
    expect(blob).toContain('"@type":"Dataset"');
    expect(blob).toContain("2026-Q2");
    expect(blob).toContain("price-paid-data-downloads");
  });

  it("links the CSV download, league and methodology pages", async () => {
    await renderPage();
    expect(
      screen.getByRole("link", { name: /download the CSV/i }),
    ).toHaveAttribute("href", "/api/reports/reality-gap/csv?edition=2026-Q2");
    expect(
      screen.getByRole("link", { name: /full Postcode Truth League/i }),
    ).toHaveAttribute("href", "/reports/reality-gap/league");
    expect(
      screen.getAllByRole("link", { name: /methodology/i })[0],
    ).toHaveAttribute("href", "/reports/reality-gap/methodology");
  });

  it("offers an edition switcher with the current edition marked", async () => {
    await renderPage();
    const current = screen.getByRole("link", { name: "2026-Q2", current: "page" });
    expect(current).toHaveAttribute(
      "href",
      "/reports/reality-gap?edition=2026-Q2",
    );
    expect(screen.getByRole("link", { name: "2026-Q1" })).toBeInTheDocument();
  });

  it("gates an unpublished future edition behind the embargo panel", async () => {
    mockGet.mockResolvedValue({ ...editionResult(), edition: null, period: null });
    await renderPage({ edition: "2027-Q1" });
    expect(
      screen.getByText(/This edition is not yet published/),
    ).toBeInTheDocument();
    expect(screen.queryByText("+5.2%")).not.toBeInTheDocument();
  });

  it("shows honest holding copy when nothing clears the thresholds yet", async () => {
    mockGet.mockResolvedValue({
      edition: null,
      period: null,
      availablePeriods: [],
      rows: [],
    });
    await renderPage();
    expect(
      screen.getByText(/No cells clear the disclosed sample thresholds yet/),
    ).toBeInTheDocument();
  });
});
