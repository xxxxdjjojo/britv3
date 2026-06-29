import { describe, expect, test } from "vitest";
import { buildLeadsCsv, escapeCsvCell, toCsv } from "./csv";
import type { DevelopmentLead } from "./types";

describe("escapeCsvCell", () => {
  test("leaves plain values unquoted", () => {
    expect(escapeCsvCell("hello")).toBe("hello");
    expect(escapeCsvCell(42)).toBe("42");
  });

  test("quotes and escapes values with commas, quotes or newlines", () => {
    expect(escapeCsvCell("a,b")).toBe('"a,b"');
    expect(escapeCsvCell('he said "hi"')).toBe('"he said ""hi"""');
    expect(escapeCsvCell("line1\nline2")).toBe('"line1\nline2"');
  });

  test("renders null/undefined as empty", () => {
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });
});

describe("toCsv", () => {
  test("joins headers and rows with CRLF", () => {
    const csv = toCsv(["a", "b"], [[1, 2], [3, 4]]);
    expect(csv).toBe("a,b\r\n1,2\r\n3,4");
  });
});

describe("buildLeadsCsv", () => {
  test("produces a header row plus one row per lead, escaping messages", () => {
    const leads: DevelopmentLead[] = [
      {
        id: "1",
        developmentId: "dev-1",
        unitId: null,
        leadType: "register_interest",
        status: "new",
        name: "Jane Buyer",
        email: "jane@example.com",
        phone: "07700900000",
        buyerStatus: "first_time_buyer",
        budget: 320000,
        desiredMoveDate: "Within 3 months",
        mortgagePosition: "applied",
        hasPropertyToSell: true,
        preferredPlot: "P03",
        message: "Loved it, call me, please",
        sourceRoute: "/new-homes/x",
        utmSource: "google",
        createdAt: "2026-06-01T00:00:00Z",
        developmentName: "Edgbaston Gardens",
      },
    ];
    const csv = buildLeadsCsv(leads);
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("Name");
    expect(lines[1]).toContain("Jane Buyer");
    expect(lines[1]).toContain("Edgbaston Gardens");
    // message contains commas → must be quoted
    expect(lines[1]).toContain('"Loved it, call me, please"');
  });

  test("handles an empty lead list (header only)", () => {
    expect(buildLeadsCsv([]).split("\r\n")).toHaveLength(1);
  });
});
