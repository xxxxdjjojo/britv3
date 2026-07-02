import { describe, expect, it } from "vitest";
import {
  buildLeadsCsv,
  LEADS_CSV_HEADERS,
} from "@/services/agent/agent-lead-export-service";
import type { AgentLead } from "@/types/agent";

function makeLead(overrides: Partial<AgentLead> = {}): AgentLead {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    agent_id: "22222222-2222-4222-8222-222222222222",
    property_id: null,
    contact_name: "Jane Doe",
    contact_email: "jane@example.com",
    contact_phone: "07700 900000",
    stage: "new_enquiry",
    source: "website",
    assigned_to: null,
    notes: null,
    created_at: "2026-07-01T10:00:00Z",
    updated_at: "2026-07-01T11:00:00Z",
    ...overrides,
  };
}

describe("buildLeadsCsv", () => {
  it("starts with a UTF-8 BOM so Excel detects the encoding", () => {
    const csv = buildLeadsCsv([]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });

  it("emits the header row in the exported column order", () => {
    const csv = buildLeadsCsv([]);
    const firstLine = csv.replace("\uFEFF", "").split("\r\n")[0];

    expect(firstLine).toBe(LEADS_CSV_HEADERS.join(","));
    expect(LEADS_CSV_HEADERS).toEqual([
      "contact_name",
      "contact_email",
      "contact_phone",
      "stage",
      "source",
      "property_id",
      "notes",
      "created_at",
      "updated_at",
    ]);
  });

  it("uses CRLF line endings throughout, including a trailing newline", () => {
    const csv = buildLeadsCsv([makeLead()]);

    expect(csv.endsWith("\r\n")).toBe(true);
    // No bare LF anywhere in the document structure
    expect(csv.split("\r\n").join("")).not.toContain("\n");
  });

  it("maps lead fields onto the header columns", () => {
    const csv = buildLeadsCsv([makeLead()]);
    const row = csv.replace("\uFEFF", "").split("\r\n")[1];

    expect(row).toBe(
      '"Jane Doe","jane@example.com","07700 900000","new_enquiry","website","","","2026-07-01T10:00:00Z","2026-07-01T11:00:00Z"',
    );
  });

  it.each([
    ["=SUM(A1:A9)", '"\'=SUM(A1:A9)"'],
    ["+441234", '"\'+441234"'],
    ["-2+3", '"\'-2+3"'],
    ["@cmd", '"\'@cmd"'],
    ["\tpayload", "\"'\tpayload\""],
    ["\rpayload", "\"'\rpayload\""],
  ])(
    "prefixes formula-triggering cell %j to defuse Excel injection",
    (input, expected) => {
      const csv = buildLeadsCsv([makeLead({ contact_name: input })]);
      expect(csv).toContain(expected);
    },
  );

  it("quotes cells containing commas and doubles embedded quotes", () => {
    const csv = buildLeadsCsv([
      makeLead({ notes: 'Wants a "quick" sale, cash buyer' }),
    ]);

    expect(csv).toContain('"Wants a ""quick"" sale, cash buyer"');
  });

  it("keeps cells containing newlines inside a single quoted field", () => {
    const csv = buildLeadsCsv([makeLead({ notes: "line one\nline two" })]);
    const body = csv.replace("\uFEFF", "");

    expect(body).toContain('"line one\nline two"');
    // header + 1 data row + trailing terminator; the embedded LF must not
    // create an extra CRLF record.
    expect(body.split("\r\n")).toHaveLength(3);
  });
});
