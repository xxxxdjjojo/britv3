import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

vi.mock("@/services/reports/reality-gap-service", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getRealityGapEdition: vi.fn(),
}));

import {
  buildRealityGapEdition,
  getRealityGapEdition,
} from "@/services/reports/reality-gap-service";
import TruthLeaguePage from "./page";

const mockGet = vi.mocked(getRealityGapEdition);

type RawRow = Parameters<typeof buildRealityGapEdition>[0][number];

function districtRow(
  slug: string,
  name: string,
  gap: number | null,
  overrides: Partial<RawRow> = {},
): RawRow {
  return {
    period: "2026-Q2",
    area_level: "district",
    area_id: slug,
    area_name: name,
    property_type: "all",
    tier: "area_median",
    median_asking_pounds: 300000,
    median_sold_pounds: 290000,
    gap_pct: gap,
    sample_asking_n: 45,
    sample_sold_n: 480,
    suppressed: false,
    methodology_version: 1,
    refreshed_at: "2026-07-02T10:00:00Z",
    ...overrides,
  };
}

async function renderPage(params: { edition?: string } = {}) {
  const page = await TruthLeaguePage({ searchParams: Promise.resolve(params) });
  return render(page);
}

describe("/reports/reality-gap/league page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const edition = buildRealityGapEdition([
      districtRow("manchester", "Manchester", -8.4),
      districtRow("ealing", "Ealing", 0.9),
      districtRow("leeds", "Leeds", 3.2),
      districtRow("thin", "Thin District", 12, {
        suppressed: true,
        sample_asking_n: 3,
      }),
      districtRow("thin2", "Thinner District", null, {
        suppressed: true,
        sample_asking_n: 1,
      }),
    ]);
    mockGet.mockResolvedValue({
      edition,
      period: "2026-Q2",
      availablePeriods: ["2026-Q2"],
      rows: [],
    });
  });

  it("ranks visible districts by absolute gap — smallest gap first", async () => {
    await renderPage();
    const rows = screen.getAllByRole("row").slice(1); // skip the header row
    const names = rows.map(
      (row) => row.querySelectorAll("td")[1]?.textContent ?? "",
    );
    expect(names).toEqual(["Ealing", "Leeds", "Manchester"]);
    expect(rows[0].querySelectorAll("td")[0]).toHaveTextContent("1");
  });

  it("counts suppressed districts without ranking them", async () => {
    await renderPage();
    expect(
      screen.getByText(/2 districts below sample threshold — not ranked/),
    ).toBeInTheDocument();
    expect(screen.queryByText("Thin District")).not.toBeInTheDocument();
  });

  it("links each row to its per-area OG share card", async () => {
    await renderPage();
    const shareLinks = screen.getAllByRole("link", { name: "Share card" });
    expect(shareLinks[0]).toHaveAttribute(
      "href",
      "/api/og/league?area=Ealing&rank=1&gapPct=0.9",
    );
  });

  it("renders honest framing copy about what a small gap means", async () => {
    await renderPage();
    expect(
      screen.getByText(/smaller gap means asking prices in that district sit closer/i),
    ).toBeInTheDocument();
  });

  it("holds gracefully when no edition exists yet", async () => {
    mockGet.mockResolvedValue({
      edition: null,
      period: null,
      availablePeriods: [],
      rows: [],
    });
    await renderPage();
    expect(
      screen.getByText(/appears with the first published edition/),
    ).toBeInTheDocument();
  });
});
