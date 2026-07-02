import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

vi.mock("@/services/reports/time-to-sell-service", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getTimeToSellEdition: vi.fn(),
}));

import {
  buildTimeToSellEdition,
  getTimeToSellEdition,
  type TimeToSellEditionResult,
} from "@/services/reports/time-to-sell-service";
import TimeToSellReportPage from "./page";
import TimeToSellMethodologyPage from "./methodology/page";

const mockGet = vi.mocked(getTimeToSellEdition);

type RawRow = Parameters<typeof buildTimeToSellEdition>[0][number];

function rawRow(overrides: Partial<RawRow> = {}): RawRow {
  return {
    period: "2026-Q2",
    area_level: "national",
    area_id: "uk",
    area_name: "United Kingdom",
    median_days: 174,
    sample_n: 120,
    suppressed: false,
    methodology_version: 1,
    refreshed_at: "2026-07-02T10:00:00Z",
    ...overrides,
  };
}

/** Data state: national visible + 2 visible districts + 3 suppressed. */
function dataEdition(): TimeToSellEditionResult {
  const edition = buildTimeToSellEdition([
    rawRow(),
    rawRow({
      area_level: "district",
      area_id: "fastford",
      area_name: "Fastford",
      median_days: 110,
      sample_n: 22,
    }),
    rawRow({
      area_level: "district",
      area_id: "slowtown",
      area_name: "Slowtown",
      median_days: 240,
      sample_n: 31,
    }),
    ...["thin-1", "thin-2", "thin-3"].map((id) =>
      rawRow({
        area_level: "district",
        area_id: id,
        area_name: id,
        median_days: null,
        sample_n: 3,
        suppressed: true,
      }),
    ),
  ]);
  return { edition, period: "2026-Q2", availablePeriods: ["2026-Q2", "2026-Q1"] };
}

/** Today's prod state: one suppressed zero-sample national row, nothing else. */
function allSuppressedEdition(): TimeToSellEditionResult {
  const edition = buildTimeToSellEdition([
    rawRow({ median_days: null, sample_n: 0, suppressed: true }),
  ]);
  return { edition, period: "2026-Q2", availablePeriods: ["2026-Q2"] };
}

async function renderPage(params: { edition?: string } = {}) {
  const page = await TimeToSellReportPage({
    searchParams: Promise.resolve(params),
  });
  return render(page);
}

describe("/reports/time-to-sell page — data state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(dataEdition());
  });

  it("renders the hero with the national median days", async () => {
    await renderPage();
    expect(
      screen.getByRole("heading", { level: 1, name: "Time to Sell" }),
    ).toBeInTheDocument();
    expect(screen.getByText("174 days")).toBeInTheDocument();
    expect(
      screen.getByText(/National median, listing to completion — 2026-Q2/),
    ).toBeInTheDocument();
  });

  it("ranks the district table fastest-first with a sample_n column", async () => {
    await renderPage();
    const rows = screen.getAllByRole("row").slice(1); // drop the header row
    expect(rows[0]).toHaveTextContent("1");
    expect(rows[0]).toHaveTextContent("Fastford");
    expect(rows[0]).toHaveTextContent("110 days");
    expect(rows[0]).toHaveTextContent("22");
    expect(rows[1]).toHaveTextContent("Slowtown");
    expect(screen.getByText("Matched sales (n)")).toBeInTheDocument();
  });

  it("always renders the coverage honesty block with published/suppressed counts", async () => {
    await renderPage();
    expect(
      screen.getByText(
        /2 districts published · 3 below the disclosed sample threshold \(15 matched sales\/12 months\)/,
      ),
    ).toBeInTheDocument();
  });

  it("offers an edition switcher with the current edition marked", async () => {
    await renderPage();
    const current = screen.getByRole("link", { name: "2026-Q2", current: "page" });
    expect(current).toHaveAttribute("href", "/reports/time-to-sell?edition=2026-Q2");
    expect(screen.getByRole("link", { name: "2026-Q1" })).toBeInTheDocument();
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
  });

  it("links the methodology page", async () => {
    await renderPage();
    // Body copy AND the MethodologyFooter both link it.
    const links = screen.getAllByRole("link", { name: /read the full methodology/i });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/reports/time-to-sell/methodology");
    }
  });
});

describe("/reports/time-to-sell page — all-suppressed honest state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(allSuppressedEdition());
  });

  it("renders the coverage state as the content, with the matched-pair count", async () => {
    await renderPage();
    expect(
      screen.getByText(
        /0 districts published · 0 below the disclosed sample threshold/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No figure clears the disclosed threshold yet/),
    ).toBeInTheDocument();
    expect(screen.getByText(/0 confirmed matched sales/)).toBeInTheDocument();
  });

  it("explains why completion dates are harder to game and when districts appear", async () => {
    await renderPage();
    expect(
      screen.getByText(/harder to game than .days to under offer./i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /When districts will appear/ }),
    ).toBeInTheDocument();
  });

  it("never renders a suppressed figure as days", async () => {
    await renderPage();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText(/^\d+ days$/)).not.toBeInTheDocument();
  });

  it("stays honest when the table is completely empty too", async () => {
    mockGet.mockResolvedValue({ edition: null, period: null, availablePeriods: [] });
    await renderPage();
    expect(
      screen.getByText(/0 districts published · 0 below the disclosed sample threshold/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No figure clears the disclosed threshold yet/),
    ).toBeInTheDocument();
  });
});

describe("/reports/time-to-sell/methodology page", () => {
  it("discloses the exact threshold, matched-pair definition and version stamp", () => {
    render(<TimeToSellMethodologyPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Time to Sell methodology" }),
    ).toBeInTheDocument();
    // Threshold is disclosed in the body AND repeated in the footer caveats.
    expect(screen.getAllByText(/15 confirmed matched sales/).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", { name: /confirmed matches only/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/transfer date/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/v1/)).toBeInTheDocument();
  });
});
