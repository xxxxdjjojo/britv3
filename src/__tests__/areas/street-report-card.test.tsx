import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  StreetReportCard,
  StreetReportCardActions,
} from "@/app/(main)/area-prices/StreetReportCard";
import type {
  RecentSale,
  SectorTrend,
} from "@/services/truedeed/ppd-postcode-service";

const { trackToolCompleted } = vi.hoisted(() => ({ trackToolCompleted: vi.fn() }));
vi.mock("@/lib/analytics/influence-events", () => ({ trackToolCompleted }));

const SALES: RecentSale[] = [
  {
    id: "{TUID-1}",
    pricePounds: 314_500,
    date: "2026-03-14",
    propertyTypeLabel: "Terraced",
    street: "12 Acacia Avenue",
    newBuild: false,
  },
];

const TREND: SectorTrend = {
  sector: "M1 1",
  months: [
    { month: "2026-01", median: 240_000, count: 12 },
    { month: "2026-06", median: 250_000, count: 20 },
  ],
  totalCount: 32,
  insufficient: false,
};

const BASE_PROPS = {
  postcode: "M1 1AE",
  areaName: "M1 1AE · Manchester",
  flatMedianPounds: 311_000,
  houseMedianPounds: 286_800,
  recentSales: SALES,
  trend: TREND,
  generatedOn: "2 July 2026",
} as const;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("StreetReportCard", () => {
  it("renders header, date stamp, source line and watermark", () => {
    render(<StreetReportCard {...BASE_PROPS} />);

    expect(
      screen.getByRole("heading", { name: /street report card — M1 1AE/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("M1 1AE · Manchester")).toBeInTheDocument();
    expect(screen.getByText(/Generated 2 July 2026/)).toBeInTheDocument();
    expect(
      screen.getByText(/Source: HM Land Registry Price Paid Data \(Crown copyright\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/truedeed\.co\.uk\/area-prices — free for anyone/i),
    ).toBeInTheDocument();
    // Real rows render through the shared RecentSalesList — no forked formatting.
    expect(screen.getByText("£314,500")).toBeInTheDocument();
    expect(screen.getByText(/12 Acacia Avenue/)).toBeInTheDocument();
  });

  it("shows only the medians that are present", () => {
    render(<StreetReportCard {...BASE_PROPS} flatMedianPounds={null} />);

    expect(screen.queryByText(/Flat · median sold/i)).not.toBeInTheDocument();
    expect(screen.getByText(/House · median sold/i)).toBeInTheDocument();
    expect(screen.getByText("£286,800")).toBeInTheDocument();
  });

  it("renders an honest empty state when there are no sales — never fabricates", () => {
    render(<StreetReportCard {...BASE_PROPS} recentSales={[]} />);

    expect(
      screen.getByText(/No registered sales for M1 1AE in the most recent Land Registry data/i),
    ).toBeInTheDocument();
    // No sales table is rendered — nothing fabricated to fill the gap.
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("carries the print-isolation id and scoped @media print styles", () => {
    const { container } = render(<StreetReportCard {...BASE_PROPS} />);

    expect(container.querySelector("#street-report-card")).not.toBeNull();
    const source = readFileSync(
      path.join(process.cwd(), "src/app/(main)/area-prices/StreetReportCard.tsx"),
      "utf8",
    );
    expect(source).toContain("@media print");
    expect(source).toContain("visibility: hidden");
    expect(source).toMatch(/#\$\{STREET_REPORT_CARD_ID\}[\s\S]*visibility: visible/);
  });
});

describe("StreetReportCardActions", () => {
  it("prints via window.print and tracks tool_completed(action: print)", () => {
    const printSpy = vi.fn();
    vi.stubGlobal("print", printSpy); // jsdom has no window.print
    render(<StreetReportCardActions postcode="M1 1AE" />);

    fireEvent.click(screen.getByRole("button", { name: /print \/ save as pdf/i }));

    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(trackToolCompleted).toHaveBeenCalledWith("street_report_card", {
      action: "print",
    });
    vi.unstubAllGlobals();
  });

  it("links the OG share-card PNG with the loaded medians and tracks the download", () => {
    render(
      <StreetReportCardActions
        postcode="M1 1AE"
        areaName="M1 1AE · Manchester"
        flatMedianPounds={311_000}
        houseMedianPounds={286_800}
      />,
    );

    const link = screen.getByRole("link", { name: /download share card \(png\)/i });
    const href = link.getAttribute("href") ?? "";
    expect(href.startsWith("/api/og/postcode?")).toBe(true);
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("postcode")).toBe("M1 1AE");
    expect(params.get("area")).toBe("M1 1AE · Manchester");
    expect(params.get("flatMedian")).toBe("311000");
    expect(params.get("houseMedian")).toBe("286800");
    expect(link).toHaveAttribute("download", "street-report-card-m1-1ae.png");

    fireEvent.click(link);
    expect(trackToolCompleted).toHaveBeenCalledWith("street_report_card", {
      action: "og_download",
    });
  });

  it("omits absent medians from the OG URL rather than sending zeros", () => {
    render(<StreetReportCardActions postcode="M1 1AE" />);

    const href =
      screen.getByRole("link", { name: /download share card/i }).getAttribute("href") ?? "";
    expect(href).not.toContain("flatMedian");
    expect(href).not.toContain("houseMedian");
    expect(href).not.toContain("area=");
  });
});

describe("AreaPricesExplorer wiring", () => {
  it("renders the StreetReportCard from the explorer", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/app/(main)/area-prices/AreaPricesExplorer.tsx"),
      "utf8",
    );
    expect(source).toContain("StreetReportCard");
    expect(source).toContain("StreetReportCardActions");
  });
});
