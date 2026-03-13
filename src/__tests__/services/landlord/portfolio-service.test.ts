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
  rpcData = mockRpcData,
  rpcError = null,
  fromData = [] as unknown[],
  fromError = null as null | { message: string },
}: {
  user?: { id: string } | null;
  rpcData?: typeof mockRpcData | null;
  rpcError?: null | { message: string };
  fromData?: unknown[];
  fromError?: null | { message: string };
} = {}) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
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
      const supabase = createSupabaseMock({ fromData: [] });
      const result = await getPortfolioProperties(supabase as never);
      expect(Array.isArray(result)).toBe(true);
    });

    it("throws authentication error when user is not authenticated", async () => {
      const supabase = createSupabaseMock({ user: null });
      await expect(getPortfolioProperties(supabase as never)).rejects.toThrow(/Authentication required/i);
    });
  });
});
