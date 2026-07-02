import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { NotLegalAdviceBanner } from "../NotLegalAdviceBanner";
import { ContentVersionStamp } from "../ContentVersionStamp";
import { MethodologyFooter } from "../MethodologyFooter";
import { SourcedFigure } from "../SourcedFigure";

describe("NotLegalAdviceBanner", () => {
  it("renders the legal-advice disclaimer for the rights variant", () => {
    render(<NotLegalAdviceBanner variant="rights" />);

    const note = screen.getByRole("note");
    expect(note).toHaveTextContent("This is general information, not legal advice.");
    expect(note).toHaveTextContent("Speak to a qualified professional about your situation.");
  });

  it("swaps in 'not tax advice' for the tax variant", () => {
    render(<NotLegalAdviceBanner variant="tax" />);

    expect(screen.getByRole("note")).toHaveTextContent(
      "This is general information, not tax advice.",
    );
  });

  it("swaps in 'not financial advice' for the finance variant", () => {
    render(<NotLegalAdviceBanner variant="finance" />);

    expect(screen.getByRole("note")).toHaveTextContent(
      "This is general information, not financial advice.",
    );
  });
});

describe("ContentVersionStamp", () => {
  it("renders the exact legislation-check copy with a <time> element", () => {
    const { container } = render(
      <ContentVersionStamp checkedDate="2026-06-01" version={3} />,
    );

    expect(container.textContent).toBe(
      "Checked against legislation in force on 2026-06-01, v3",
    );

    const time = container.querySelector("time");
    expect(time).not.toBeNull();
    expect(time).toHaveAttribute("dateTime", "2026-06-01");
  });
});

describe("MethodologyFooter", () => {
  const sources = [
    { label: "ONS Private Rent Index", url: "https://www.ons.gov.uk/rent-index" },
    { label: "English Housing Survey", url: "https://www.gov.uk/ehs" },
  ];
  const caveats = [
    "Sample excludes Northern Ireland.",
    "Figures lag the market by roughly two months.",
  ];

  it("renders every source as a safe external link", () => {
    render(<MethodologyFooter sources={sources} caveats={caveats} />);

    for (const source of sources) {
      const link = screen.getByRole("link", { name: source.label });
      expect(link).toHaveAttribute("href", source.url);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
      expect(link).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
    }
  });

  it("renders every known caveat", () => {
    render(<MethodologyFooter sources={sources} caveats={caveats} />);

    for (const caveat of caveats) {
      expect(screen.getByText(caveat)).toBeInTheDocument();
    }
  });

  it("renders the methodology link only when methodologyHref is given", () => {
    const { rerender } = render(
      <MethodologyFooter sources={sources} caveats={caveats} />,
    );
    expect(
      screen.queryByRole("link", { name: /read the full methodology/i }),
    ).not.toBeInTheDocument();

    rerender(
      <MethodologyFooter
        sources={sources}
        caveats={caveats}
        methodologyHref="/reports/methodology"
      />,
    );
    expect(
      screen.getByRole("link", { name: /read the full methodology/i }),
    ).toHaveAttribute("href", "/reports/methodology");
  });
});

describe("SourcedFigure", () => {
  it("renders the value with an inline citation link to the source", () => {
    render(
      <SourcedFigure
        value="£1,341"
        source={{ url: "https://www.ons.gov.uk/rent-index", label: "ONS" }}
      />,
    );

    expect(screen.getByText("£1,341")).toBeInTheDocument();

    const citation = screen.getByRole("link", { name: "ONS" });
    expect(citation).toHaveAttribute("href", "https://www.ons.gov.uk/rent-index");
    expect(citation.closest("sup")).not.toBeNull();
  });
});
