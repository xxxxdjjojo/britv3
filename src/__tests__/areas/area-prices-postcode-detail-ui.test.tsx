import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrendSparkline } from "@/app/(main)/area-prices/TrendSparkline";
import { RecentSalesList } from "@/app/(main)/area-prices/RecentSalesList";
import { generateMetadata } from "@/app/(main)/area-prices/page";
import type {
  RecentSale,
  SectorTrend,
} from "@/services/truedeed/ppd-postcode-service";

const SUFFICIENT_TREND: SectorTrend = {
  sector: "M1 1",
  months: [
    { month: "2026-01", median: 240_000, count: 12 },
    { month: "2026-03", median: 255_000, count: 3 }, // small-sample month
    { month: "2026-06", median: 250_000, count: 20 },
  ],
  totalCount: 35,
  insufficient: false,
};

describe("TrendSparkline (self-gating)", () => {
  it("renders NOTHING when the trend is insufficient", () => {
    const { container } = render(
      <TrendSparkline
        trend={{ sector: "M1 1", months: [], totalCount: 4, insufficient: true }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing with fewer than two months of real sales", () => {
    const { container } = render(
      <TrendSparkline
        trend={{
          ...SUFFICIENT_TREND,
          months: [{ month: "2026-06", median: 250_000, count: 31 }],
          totalCount: 31,
        }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the sector trend with an honest sales-count caption", () => {
    render(<TrendSparkline trend={SUFFICIENT_TREND} />);

    expect(
      screen.getByText(/12-month sold-price trend for M1 1/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/35\s*sales/i)).toBeInTheDocument();
    // One dot per month with data — none fabricated for empty months.
    const figure = screen.getByRole("figure", {
      name: /12-month sold-price trend for M1 1/i,
    });
    expect(figure.querySelectorAll("circle")).toHaveLength(3);
  });
});

describe("RecentSalesList (real PPD rows only)", () => {
  const SALES: RecentSale[] = [
    {
      id: "{TUID-1}",
      pricePounds: 314_500,
      date: "2026-03-14",
      propertyTypeLabel: "Terraced",
      street: "12 Acacia Avenue",
      newBuild: false,
    },
    {
      id: "{TUID-2}",
      pricePounds: 450_000,
      date: "2025-11-03",
      propertyTypeLabel: "Detached",
      street: "3 Mill Lane",
      newBuild: true,
    },
  ];

  it("renders NOTHING when there are no sales", () => {
    const { container } = render(<RecentSalesList postcode="M1 1AE" sales={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders each sale with date, address, type and formatted price", () => {
    render(<RecentSalesList postcode="M1 1AE" sales={SALES} />);

    expect(
      screen.getByRole("heading", { name: /recent sales in M1 1AE/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Mar 2026")).toBeInTheDocument();
    expect(screen.getByText(/12 Acacia Avenue/)).toBeInTheDocument();
    expect(screen.getByText("Terraced")).toBeInTheDocument();
    expect(screen.getByText("£314,500")).toBeInTheDocument();
    expect(screen.getByText("£450,000")).toBeInTheDocument();
    // New-build tag only where new_build is true.
    expect(screen.getAllByText(/new build/i)).toHaveLength(1);
    expect(
      screen.getByText(/Source: HM Land Registry Price Paid Data/i),
    ).toBeInTheDocument();
  });
});

describe("/area-prices generateMetadata (?postcode= OG deep link)", () => {
  it("points OG/twitter images at /api/og/postcode for a plausible postcode", async () => {
    const metadata = await generateMetadata({
      searchParams: Promise.resolve({ postcode: "m1 1ae" }),
    });

    expect(metadata.title).toMatch(/^Median sold price in M1 1AE \| /);
    const ogImages = metadata.openGraph?.images;
    expect(String(ogImages)).toContain("/api/og/postcode?postcode=M1%201AE");
    expect(String(metadata.twitter?.images)).toContain(
      "/api/og/postcode?postcode=M1%201AE",
    );
    // Canonical stays the tool page — postcode variants are not separate pages.
    expect(metadata.alternates?.canonical).toBe("/area-prices");
  });

  it("falls back to the default metadata for a missing or implausible postcode", async () => {
    const missing = await generateMetadata({ searchParams: Promise.resolve({}) });
    const junk = await generateMetadata({
      searchParams: Promise.resolve({ postcode: "DROP TABLE;" }),
    });

    for (const metadata of [missing, junk]) {
      expect(metadata.title).toMatch(/Area Prices/i);
      expect(metadata.openGraph).not.toHaveProperty("images");
    }
  });
});

describe("/tools/true-equity-checker", () => {
  it("is a redirect to /area-prices, not a duplicate surface", () => {
    const page = path.join(
      process.cwd(),
      "src/app/(main)/tools/true-equity-checker/page.tsx",
    );
    expect(existsSync(page)).toBe(true);
    expect(readFileSync(page, "utf8")).toMatch(/redirect\(["']\/area-prices["']\)/);
  });
});
