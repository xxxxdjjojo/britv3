import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DataWireClient } from "./DataWireClient";
import type { WireArea } from "@/services/data-wire/data-wire-service";

const AREAS: WireArea[] = [
  {
    areaId: "ealing",
    areaName: "Ealing",
    period: "2026-Q2",
    gapPct: 2.1,
    medianAskingPounds: 500000,
    medianSoldPounds: 489000,
    sampleAskingN: 40,
    sampleSoldN: 400,
    rank: 1,
    totalRanked: 2,
  },
  {
    areaId: "hounslow",
    areaName: "Hounslow",
    period: "2026-Q2",
    gapPct: -6.2,
    medianAskingPounds: 400000,
    medianSoldPounds: 426000,
    sampleAskingN: 30,
    sampleSoldN: 300,
    rank: 2,
    totalRanked: 2,
  },
];

describe("DataWireClient", () => {
  it("renders the period, thresholds note and one row per district", () => {
    render(<DataWireClient period="2026-Q2" areas={AREAS} />);

    expect(screen.getByText("Edition 2026-Q2")).toBeTruthy();
    expect(screen.getByText(/disclosed sample thresholds/)).toBeTruthy();
    expect(screen.getByText("Ealing")).toBeTruthy();
    expect(screen.getByText("Hounslow")).toBeTruthy();
    expect(screen.getByText(/Gap \+2\.1% · Rank 1 of 2/)).toBeTruthy();
    expect(
      screen.getAllByRole("button", { name: /Generate pack/ }),
    ).toHaveLength(2);
  });

  it("filters districts by search query", () => {
    render(<DataWireClient period="2026-Q2" areas={AREAS} />);

    fireEvent.change(screen.getByLabelText("Search districts"), {
      target: { value: "houns" },
    });

    expect(screen.queryByText("Ealing")).toBeNull();
    expect(screen.getByText("Hounslow")).toBeTruthy();
  });

  it("previews the generated headline and paragraphs inline", () => {
    render(<DataWireClient period="2026-Q2" areas={AREAS} />);

    fireEvent.click(screen.getAllByRole("button", { name: /Preview/ })[0]);

    expect(
      screen.getByText(
        "Asking prices in Ealing were 2.1% above what buyers actually paid",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(/Postcode Truth League/),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Copy as text/ }),
    ).toBeTruthy();
  });
});
