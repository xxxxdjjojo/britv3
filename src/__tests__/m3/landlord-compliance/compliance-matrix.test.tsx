// M3-A1 — Landlord compliance matrix + expiring-documents alert list.
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ComplianceMatrix } from "@/components/landlord/ComplianceMatrix";
import ComplianceAlert from "@/components/landlord/ComplianceAlert";
import type {
  MatrixData,
  MatrixCell,
} from "@/services/landlord/compliance-matrix-service";
import type { PropertyDocument } from "@/types/landlord";

// A far-future expiry so getDaysUntil() stays positive and deterministic-ish.
const FUTURE_EXPIRY = "2099-12-31";

function cell(partial: Partial<MatrixCell> & { category: string }): MatrixCell {
  return {
    status: "valid",
    docId: "doc-1",
    expiryDate: FUTURE_EXPIRY,
    ...partial,
  };
}

function buildMatrix(overrides?: Partial<MatrixData>): MatrixData {
  return {
    categories: ["gas_safety", "epc"],
    properties: [
      {
        propertyId: "prop-1",
        propertyAddress: "42 Baker Street",
        isHmo: true,
        cells: [
          cell({ category: "gas_safety", status: "valid" }),
          cell({ category: "epc", status: "missing", docId: null, expiryDate: null }),
        ],
      },
    ],
    ...overrides,
  };
}

describe("ComplianceMatrix — render with data", () => {
  it("renders a column header per category", () => {
    render(<ComplianceMatrix data={buildMatrix()} />);
    expect(screen.getByText("Gas Safety")).toBeInTheDocument();
    expect(screen.getByText("Energy Performance")).toBeInTheDocument();
  });

  it("renders the property address and HMO badge", () => {
    render(<ComplianceMatrix data={buildMatrix()} />);
    expect(screen.getByText("42 Baker Street")).toBeInTheDocument();
    expect(screen.getByText("HMO")).toBeInTheDocument();
  });

  it("renders an Upload link for a missing certificate cell", () => {
    render(<ComplianceMatrix data={buildMatrix()} />);
    const uploadLink = screen.getByRole("link", { name: /Upload/i });
    expect(uploadLink).toHaveAttribute(
      "href",
      "/dashboard/landlord/compliance/upload?category=epc",
    );
  });

  it("renders a countdown badge for a cell with a future expiry date", () => {
    render(<ComplianceMatrix data={buildMatrix()} />);
    // gas_safety cell has FUTURE_EXPIRY -> countdown badge shows "<n>d".
    expect(screen.getByText(/\d+d$/)).toBeInTheDocument();
  });

  it("renders a plain 'Valid' badge for a non-missing cell with no expiry date", () => {
    const data = buildMatrix({
      categories: ["gas_safety"],
      properties: [
        {
          propertyId: "prop-2",
          propertyAddress: "9 Elm Court",
          isHmo: false,
          cells: [cell({ category: "gas_safety", status: "valid", expiryDate: null })],
        },
      ],
    });
    render(<ComplianceMatrix data={data} />);
    expect(screen.getByText("Valid")).toBeInTheDocument();
    expect(screen.queryByText("HMO")).not.toBeInTheDocument();
  });
});

describe("ComplianceMatrix — empty state", () => {
  it("renders the empty-portfolio message when there are no properties", () => {
    render(<ComplianceMatrix data={{ categories: [], properties: [] }} />);
    expect(
      screen.getByText("No properties in your portfolio yet."),
    ).toBeInTheDocument();
    // No table is rendered in the empty branch.
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});

function buildDoc(overrides: Partial<PropertyDocument>): PropertyDocument {
  return {
    id: "doc-1",
    property_id: "prop-1",
    tenancy_id: null,
    uploaded_by: "user-1",
    name: "Gas Safety Certificate",
    category: "gas_safety" as PropertyDocument["category"],
    file_url: "https://example.com/doc.pdf",
    file_size: 1024,
    expiry_date: "2026-07-01",
    next_reminder_date: null,
    reminder_sent: false,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("ComplianceAlert — expiring documents list", () => {
  it("renders nothing when there are no expiring documents (empty state)", () => {
    const { container } = render(
      <ComplianceAlert expiringDocuments={[]} propertyId="prop-1" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("pluralises the heading and lists document names", () => {
    render(
      <ComplianceAlert
        expiringDocuments={[
          buildDoc({ id: "d1", name: "Gas Cert" }),
          buildDoc({ id: "d2", name: "EPC Cert" }),
        ]}
        propertyId="prop-1"
      />,
    );
    expect(screen.getByText("2 compliance documents expiring soon")).toBeInTheDocument();
    expect(screen.getByText(/Gas Cert/)).toBeInTheDocument();
    expect(screen.getByText(/EPC Cert/)).toBeInTheDocument();
  });

  it("uses singular wording for a single expiring document", () => {
    render(
      <ComplianceAlert
        expiringDocuments={[buildDoc({ id: "d1", name: "Solo Cert" })]}
        propertyId="prop-1"
      />,
    );
    expect(screen.getByText("1 compliance document expiring soon")).toBeInTheDocument();
  });

  it("caps the visible list at 3 and shows an 'and N more' overflow row", () => {
    const docs = Array.from({ length: 5 }, (_, i) =>
      buildDoc({ id: `d${i}`, name: `Cert ${i}` }),
    );
    render(<ComplianceAlert expiringDocuments={docs} propertyId="prop-1" />);
    const list = screen.getByRole("list");
    // 3 visible doc rows + 1 overflow row.
    expect(within(list).getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByText("and 2 more...")).toBeInTheDocument();
  });

  it("links to the property documents page", () => {
    render(
      <ComplianceAlert
        expiringDocuments={[buildDoc({ id: "d1" })]}
        propertyId="prop-9"
      />,
    );
    expect(
      screen.getByRole("link", { name: "View documents" }),
    ).toHaveAttribute("href", "/dashboard/landlord/properties/prop-9/documents");
  });
});
