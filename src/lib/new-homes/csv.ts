// Pure CSV helpers for exporting developer leads. Kept side-effect free so the
// row-building logic is unit-testable; the browser download lives in the
// client component.

import type { DevelopmentLead } from "./types";

/** Escape a CSV cell per RFC 4180 (quote if it contains comma, quote or newline). */
export function escapeCsvCell(value: string | number | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(
  headers: ReadonlyArray<string>,
  rows: ReadonlyArray<ReadonlyArray<string | number | null | undefined>>,
): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(","));
  return lines.join("\r\n");
}

const LEAD_HEADERS = [
  "Created",
  "Name",
  "Email",
  "Phone",
  "Development",
  "Type",
  "Status",
  "Buyer status",
  "Budget",
  "Move date",
  "Mortgage",
  "Has property to sell",
  "Preferred plot",
  "Source",
  "Message",
] as const;

export function buildLeadsCsv(leads: ReadonlyArray<DevelopmentLead>): string {
  const rows = leads.map((lead) => [
    lead.createdAt,
    lead.name,
    lead.email,
    lead.phone ?? "",
    lead.developmentName ?? lead.developmentId,
    lead.leadType,
    lead.status,
    lead.buyerStatus ?? "",
    lead.budget ?? "",
    lead.desiredMoveDate ?? "",
    lead.mortgagePosition ?? "",
    lead.hasPropertyToSell == null ? "" : lead.hasPropertyToSell ? "yes" : "no",
    lead.preferredPlot ?? "",
    lead.utmSource ?? lead.sourceRoute ?? "",
    lead.message ?? "",
  ]);
  return toCsv(LEAD_HEADERS, rows);
}
