/**
 * Tests for document-service covering LD-06 compliance summary.
 */
import { describe, it, expect, vi } from "vitest";
import { getComplianceSummary } from "@/services/landlord/document-service";

const today = new Date();
const pastDate = new Date(today);
pastDate.setDate(pastDate.getDate() - 1);
const soonDate = new Date(today);
soonDate.setDate(soonDate.getDate() + 15);
const futureDate = new Date(today);
futureDate.setDate(futureDate.getDate() + 60);

function makeDoc(overrides: Record<string, unknown>) {
  return {
    id: "doc-1",
    property_id: "prop-1",
    category: "gas_safety",
    expiry_date: futureDate.toISOString().slice(0, 10),
    property: { address_line_1: "1 Main St", city: "London", postcode: "W1A 1AA" },
    ...overrides,
  };
}

function createSupabaseMock(docs: ReturnType<typeof makeDoc>[]) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    then: vi.fn((resolve: (v: { data: unknown[]; error: null }) => void) =>
      resolve({ data: docs, error: null }),
    ),
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue(chain),
  };
}

describe("document-service", () => {
  describe("getComplianceSummary", () => {
    it("returns documents grouped as expired / expiring_soon / valid", async () => {
      const docs = [
        makeDoc({ id: "d1", expiry_date: pastDate.toISOString().slice(0, 10) }),
        makeDoc({ id: "d2", expiry_date: soonDate.toISOString().slice(0, 10) }),
        makeDoc({ id: "d3", expiry_date: futureDate.toISOString().slice(0, 10) }),
      ];
      const supabase = createSupabaseMock(docs);
      const result = await getComplianceSummary(supabase as never);
      const expired = result.filter((d) => d.status === "expired");
      const expiring = result.filter((d) => d.status === "expiring_soon");
      const valid = result.filter((d) => d.status === "valid");
      expect(expired).toHaveLength(1);
      expect(expiring).toHaveLength(1);
      expect(valid).toHaveLength(1);
    });

    it("expiring_soon = expiry_date within 30 days from today", async () => {
      const docs = [
        makeDoc({ id: "d1", expiry_date: soonDate.toISOString().slice(0, 10) }),
      ];
      const supabase = createSupabaseMock(docs);
      const result = await getComplianceSummary(supabase as never);
      expect(result[0].status).toBe("expiring_soon");
    });

    it("expired = expiry_date before today", async () => {
      const docs = [
        makeDoc({ id: "d1", expiry_date: pastDate.toISOString().slice(0, 10) }),
      ];
      const supabase = createSupabaseMock(docs);
      const result = await getComplianceSummary(supabase as never);
      expect(result[0].status).toBe("expired");
    });
  });
});
