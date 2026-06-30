import { describe, expect, it, vi } from "vitest";
import { getDepositComplianceCounts } from "@/services/landlord/deposit-service";

type QueryResult = Readonly<{
  data: unknown[];
  error: null | { message: string };
}>;

function createQuery(result: QueryResult) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    then: vi.fn((resolve: (value: QueryResult) => void) => resolve(result)),
  };
}

function createSupabaseMock({
  tenancies,
  deposits,
}: {
  tenancies: unknown[];
  deposits: unknown[];
}) {
  const tenanciesQuery = createQuery({ data: tenancies, error: null });
  const depositsQuery = createQuery({ data: deposits, error: null });

  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "landlord-1" } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "tenancies") return tenanciesQuery;
        if (table === "deposit_registrations") return depositsQuery;
        throw new Error(`Unexpected table: ${table}`);
      }),
    },
    tenanciesQuery,
    depositsQuery,
  };
}

describe("deposit-service", () => {
  describe("getDepositComplianceCounts", () => {
    it("fetches deposits by active tenancy IDs instead of deposit_registrations.landlord_id", async () => {
      const { supabase, depositsQuery } = createSupabaseMock({
        tenancies: [
          { id: "tenancy-registered", deposit_amount: 1200 },
          { id: "tenancy-pending", deposit_amount: 900 },
          { id: "tenancy-missing", deposit_amount: 700 },
        ],
        deposits: [
          { tenancy_id: "tenancy-registered", status: "registered" },
          { tenancy_id: "tenancy-pending", status: "pending" },
        ],
      });

      const result = await getDepositComplianceCounts(supabase as never);

      expect(result).toEqual({
        totalTenancies: 3,
        protected: 1,
        pending: 1,
        unprotected: 1,
      });
      expect(depositsQuery.in).toHaveBeenCalledWith("tenancy_id", [
        "tenancy-registered",
        "tenancy-pending",
        "tenancy-missing",
      ]);
      expect(
        depositsQuery.eq.mock.calls.some(([column]) => column === "landlord_id"),
      ).toBe(false);
    });
  });
});
