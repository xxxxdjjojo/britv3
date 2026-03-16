/**
 * Tests for portfolio-service covering LD-01 KPI aggregation.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPortfolioKPIs, getPortfolioProperties } from "@/services/landlord/portfolio-service";

const mockRpcData = {
  total_properties: 3,
  occupied: 2,
  vacant: 1,
  occupancy_rate: 67,
  total_monthly_rent: 4500,
  compliance_alerts: 1,
  open_maintenance: 2,
  expired_compliance: 0,
};

function createSupabaseMock({
  user = { id: "user-1" },
  rpcData = mockRpcData as unknown,
  rpcError = null,
  fromData = [] as unknown[],
  fromError = null as null | { message: string },
}: {
  user?: { id: string } | null;
  rpcData?: unknown;
  rpcError?: null | { message: string };
  fromData?: unknown[];
  fromError?: null | { message: string };
} = {}) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: fromData[0] ?? null, error: fromError }),
    then: vi.fn((resolve: (v: { data: unknown[]; error: null | { message: string } }) => void) =>
      resolve({ data: fromData, error: fromError }),
    ),
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: user ? null : { message: "Not authenticated" },
      }),
    },
    from: vi.fn().mockReturnValue(chain),
    rpc: vi.fn().mockResolvedValue({ data: rpcData, error: rpcError }),
  };
}

describe("portfolio-service", () => {
  describe("getPortfolioKPIs", () => {
    it("returns correct property count, occupancy rate and monthly rent", async () => {
      const supabase = createSupabaseMock();
      const result = await getPortfolioKPIs(supabase as never);
      expect(result.total_properties).toBe(3);
      expect(result.occupancy_rate).toBe(67);
      expect(result.total_monthly_rent).toBe(4500);
    });

    it("returns compliance_alerts count for documents expiring within 30 days", async () => {
      const supabase = createSupabaseMock();
      const result = await getPortfolioKPIs(supabase as never);
      expect(result.compliance_alerts).toBe(1);
    });

    it("returns open_maintenance count from maintenance_requests with open status", async () => {
      const supabase = createSupabaseMock();
      const result = await getPortfolioKPIs(supabase as never);
      expect(result.open_maintenance).toBe(2);
    });

    it("throws authentication error when user is not authenticated", async () => {
      const supabase = createSupabaseMock({ user: null });
      await expect(getPortfolioKPIs(supabase as never)).rejects.toThrow(/Authentication required/i);
    });
  });

  describe("getPortfolioProperties", () => {
    it("returns array of portfolio properties for authenticated landlord", async () => {
      const supabase = createSupabaseMock({ rpcData: [] });
      const result = await getPortfolioProperties(supabase as never);
      expect(Array.isArray(result)).toBe(true);
    });

    it("maps RPC row data to PortfolioProperty shape", async () => {
      const rpcRows = [
        {
          id: "prop-1",
          address_line_1: "10 Downing St",
          address_line_2: null,
          city: "London",
          postcode: "SW1A 2AA",
          property_type: "flat",
          bedrooms: 2,
          listing_id: "listing-1",
          tenant_name: "Jane Doe",
          tenancy_status: "active",
          rent_amount: "1200.00",
          rent_frequency: "monthly",
          lease_end_date: "2026-12-31",
          open_maintenance_count: 3,
          expiring_documents_count: 1,
        },
      ];
      const supabase = createSupabaseMock({ rpcData: rpcRows });
      const result = await getPortfolioProperties(supabase as never);
      expect(result).toHaveLength(1);
      expect(result[0].address_line_1).toBe("10 Downing St");
      expect(result[0].rent_amount).toBe(1200);
      expect(result[0].open_maintenance_count).toBe(3);
    });

    it("throws authentication error when user is not authenticated", async () => {
      const supabase = createSupabaseMock({ user: null });
      await expect(getPortfolioProperties(supabase as never)).rejects.toThrow(/Authentication required/i);
    });
  });
});
