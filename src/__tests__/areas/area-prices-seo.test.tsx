import { Suspense } from "react";
import { describe, expect, it } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import AreaPricesPage, { metadata } from "@/app/(main)/area-prices/page";
import { AreaPricesSeoContent } from "@/app/(main)/area-prices/AreaPricesSeoContent";

describe("/area-prices metadata", () => {
  it("keeps the canonical and headline title + adds openGraph", () => {
    expect(metadata.title).toMatch(/Area Prices/i);
    expect(metadata.alternates?.canonical).toBe("/area-prices");
    expect(metadata.openGraph?.title).toMatch(/Area Prices/i);
    expect(metadata.openGraph).toHaveProperty("url");
  });
});

describe("/area-prices page JSON-LD", () => {
  function ldScripts(container: HTMLElement): string[] {
    return Array.from(
      container.querySelectorAll('script[type="application/ld+json"]'),
    ).map((s) => s.innerHTML);
  }

  it("emits FAQPage, WebPage and BreadcrumbList JSON-LD", async () => {
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<Suspense>{AreaPricesPage()}</Suspense>));
    });
    const blob = ldScripts(container).join("\n");
    expect(blob).toContain('"@type":"FAQPage"');
    expect(blob).toContain('"@type":"WebPage"');
    expect(blob).toContain('"@type":"BreadcrumbList"');
    // Dataset attribution for the sold-price data.
    expect(blob).toContain('"@type":"Dataset"');
  });
});

describe("AreaPricesSeoContent (server-rendered SEO depth)", () => {
  it("renders the methodology block", async () => {
    render(await AreaPricesSeoContent());
    expect(
      screen.getByRole("heading", { name: /how these area prices work/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/HM Land Registry median/i)).toBeInTheDocument();
  });

  it("renders popular-areas links to /areas/<city> with prices", async () => {
    render(await AreaPricesSeoContent());
    const region = screen.getByRole("region", { name: /popular areas/i });
    const links = within(region).getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(4);
    // At least one well-known city link is present and points at /areas/<slug>.
    const london = within(region).getByRole("link", { name: /London/i });
    expect(london).toHaveAttribute("href", "/areas/london");
    expect(within(region).getAllByText(/Avg/).length).toBeGreaterThan(0);
  });

  it("renders the FAQ as semantic question/answer pairs", async () => {
    render(await AreaPricesSeoContent());
    expect(
      screen.getByRole("heading", { name: /sold prices — your questions answered/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Where do these sold prices come from\?/i),
    ).toBeInTheDocument();
  });
});
