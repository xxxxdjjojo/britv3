import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Dashboard table overflow guard — F18 (PR-7a landlord + PR-7b agent tables)
 *
 * Static assertions that each dashboard table file carries both
 * overflow-x-auto (scroll container) and min-w-[640px] (table minimum
 * width) so wide tables scroll rather than overflow the page at 320–390 px
 * viewports.
 */

const LANDLORD = join(
  process.cwd(),
  "src/app/(protected)/dashboard/landlord",
);

const AGENT = join(process.cwd(), "src/components/dashboard/agent");

function read(relPath: string): string {
  return readFileSync(join(LANDLORD, relPath), "utf8");
}

const rentCollection = read("rent/RentCollectionClient.tsx");
const propertyRent = read("rent/[propertyId]/PropertyRentClient.tsx");
const compliance = read("compliance/page.tsx");
const deposits = read("deposits/DepositManagementClient.tsx");
const expenses = read("finance/expenses/ExpenseTrackerClient.tsx");

describe("landlord dashboard table overflow guard (F18)", () => {
  describe("RentCollectionClient", () => {
    it("has overflow-x-auto container", () => {
      expect(rentCollection).toContain("overflow-x-auto");
    });
    it("has min-w-[640px] on table", () => {
      expect(rentCollection).toContain("min-w-[640px]");
    });
  });

  describe("PropertyRentClient", () => {
    it("has overflow-x-auto container", () => {
      expect(propertyRent).toContain("overflow-x-auto");
    });
    it("has min-w-[640px] on table", () => {
      expect(propertyRent).toContain("min-w-[640px]");
    });
  });

  describe("compliance/page (AllCertificates table)", () => {
    it("has overflow-x-auto container", () => {
      expect(compliance).toContain("overflow-x-auto");
    });
    it("has min-w-[640px] on table", () => {
      expect(compliance).toContain("min-w-[640px]");
    });
  });

  describe("DepositManagementClient", () => {
    it("has overflow-x-auto container", () => {
      expect(deposits).toContain("overflow-x-auto");
    });
    it("has min-w-[640px] on table", () => {
      expect(deposits).toContain("min-w-[640px]");
    });
  });

  describe("ExpenseTrackerClient", () => {
    it("has overflow-x-auto container", () => {
      expect(expenses).toContain("overflow-x-auto");
    });
    it("has min-w-[640px] on table", () => {
      expect(expenses).toContain("min-w-[640px]");
    });
  });
});

// ---------------------------------------------------------------------------
// Agent dashboard tables (PR-7b)
// ---------------------------------------------------------------------------

const clientList = readFileSync(join(AGENT, "crm/ClientList.tsx"), "utf8");
const introductions = readFileSync(
  join(AGENT, "introductions/IntroductionsTable.tsx"),
  "utf8",
);
const agentInvoices = readFileSync(
  join(AGENT, "billing/AgentInvoicesTable.tsx"),
  "utf8",
);

describe("agent dashboard table overflow guard (F18)", () => {
  describe("ClientList", () => {
    it("has overflow-x-auto container", () => {
      expect(clientList).toContain("overflow-x-auto");
    });
    it("has min-w-[640px] on table", () => {
      expect(clientList).toContain("min-w-[640px]");
    });
  });

  describe("IntroductionsTable", () => {
    it("has overflow-x-auto container", () => {
      expect(introductions).toContain("overflow-x-auto");
    });
    it("has min-w-[640px] on table", () => {
      expect(introductions).toContain("min-w-[640px]");
    });
  });

  describe("AgentInvoicesTable", () => {
    it("has overflow-x-auto container", () => {
      expect(agentInvoices).toContain("overflow-x-auto");
    });
    it("has min-w-[640px] on table", () => {
      expect(agentInvoices).toContain("min-w-[640px]");
    });
  });
});
