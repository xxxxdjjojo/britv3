import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComplianceMatrix } from "./ComplianceMatrix";
import type { MatrixData } from "@/services/landlord/compliance-matrix-service";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [k: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const matrixData: MatrixData = {
  categories: ["gas_safety", "electrical_eicr"],
  properties: [
    {
      propertyId: "prop-1",
      propertyAddress: "22 Mayfair Gardens",
      isHmo: true,
      cells: [
        { category: "gas_safety", status: "expired", docId: "d1", expiryDate: "2020-01-01" },
        { category: "electrical_eicr", status: "missing", docId: null, expiryDate: null },
      ],
    },
  ],
};

describe("ComplianceMatrix", () => {
  it("renders the matrix heading and status legend", () => {
    render(<ComplianceMatrix data={matrixData} />);

    expect(
      screen.getByRole("heading", { name: /property portfolio matrix/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Valid")).toBeInTheDocument();
    expect(screen.getByText("Expiring")).toBeInTheDocument();
    expect(screen.getByText("Expired")).toBeInTheDocument();
  });

  it("renders a property row with its address and category cells", () => {
    render(<ComplianceMatrix data={matrixData} />);

    expect(screen.getByText("22 Mayfair Gardens")).toBeInTheDocument();
    expect(screen.getByText("HMO")).toBeInTheDocument();
    expect(screen.getByText("Gas Safety")).toBeInTheDocument();
    // Missing cell exposes an upload affordance.
    expect(screen.getByText("Upload")).toBeInTheDocument();
  });

  it("renders the empty state when no properties exist", () => {
    render(<ComplianceMatrix data={{ categories: [], properties: [] }} />);

    expect(
      screen.getByText(/no properties in your portfolio yet/i),
    ).toBeInTheDocument();
  });
});
