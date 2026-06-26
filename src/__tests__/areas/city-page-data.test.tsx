import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import CityAreaGuidePage from "@/app/(main)/areas/[city]/page";
import { deriveQuarterlyVolumes, priceByTypeRows } from "@/services/areas/city-chart-data";
import { buildCityFaq } from "@/services/areas/city-faq";
import { getCityData } from "@/services/areas/area-data-service";

async function renderCity(slug: string) {
  const ui = await CityAreaGuidePage({ params: Promise.resolve({ city: slug }) });
  return render(ui);
}

describe("city-chart-data helpers", () => {
  it("splits the real annual transaction total across four quarters", async () => {
    const city = (await getCityData("manchester"))!;
    const quarters = deriveQuarterlyVolumes(city);
    expect(quarters).toHaveLength(4);
    const totalSold = quarters.reduce((acc, q) => acc + q.soldVolume, 0);
    // Within rounding of the real 12-month figure.
    expect(Math.abs(totalSold - city.transactionsLast12m)).toBeLessThan(5);
  });

  it("derives labelled price-by-type rows from real priceByType", async () => {
    const city = (await getCityData("manchester"))!;
    const rows = priceByTypeRows(city);
    expect(rows.length).toBeGreaterThan(0);
    const detached = rows.find((r) => r.code === "D")!;
    expect(detached.price).toBe(city.priceByType.D);
    expect(detached.barPercent).toBeLessThanOrEqual(100);
    expect(detached.priceFormatted).toMatch(/^£\d/);
  });

  it("builds a city FAQ that references the real headline price", async () => {
    const city = (await getCityData("manchester"))!;
    const faq = buildCityFaq(city);
    expect(faq.length).toBeGreaterThanOrEqual(5);
    expect(faq[0]!.answer).toContain(city.avgPriceFormatted);
  });
});

describe("/areas/[city] page", () => {
  it("renders the price trend + sales activity + price-by-type sections", async () => {
    await renderCity("manchester");
    expect(
      screen.getByRole("heading", { name: /5-Year Price Trend/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Sales Activity/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Price by Property Type/i }),
    ).toBeInTheDocument();
    // Real property-type labels appear from CityData.priceByType.
    expect(screen.getByText("Detached")).toBeInTheDocument();
    expect(screen.getByText("Flats")).toBeInTheDocument();
  });

  it("renders the city FAQ section", async () => {
    await renderCity("manchester");
    expect(
      screen.getByRole("heading", { name: /Property Market — FAQs/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/What is the average property price in Manchester\?/i),
    ).toBeInTheDocument();
  });

  it("emits FAQPage and breadcrumb JSON-LD", async () => {
    const { container } = await renderCity("manchester");
    const blob = Array.from(
      container.querySelectorAll('script[type="application/ld+json"]'),
    )
      .map((s) => s.innerHTML)
      .join("\n");
    expect(blob).toContain('"@type":"FAQPage"');
    expect(blob).toContain('"@type":"BreadcrumbList"');
    expect(blob).toContain('"@type":"City"');
  });
});
