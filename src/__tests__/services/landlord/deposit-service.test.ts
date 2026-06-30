import { describe, expect, it, vi } from "vitest";
import {
  createDepositRegistration,
  getDepositByTenancy,
  getDepositComplianceCounts,
  listDeposits,
  updateDeposit,
} from "@/services/landlord/deposit-service";

type QueryResult = Readonly<{
  data: unknown;
  error: null | { message: string };
}>;

function createQuery(result: QueryResult) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    then: vi.fn((resolve: (value: QueryResult) => void) => resolve(result)),
  };
}

function createQueuedSupabaseMock(queriesByTable: Record<string, ReturnType<typeof createQuery>[]>) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "landlord-1" } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      const query = queriesByTable[table]?.shift();
      if (!query) throw new Error(`Unexpected table query: ${table}`);
      return query;
    }),
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
  describe("createDepositRegistration", () => {
    it("verifies tenancy ownership and inserts without deposit_registrations.landlord_id", async () => {
      const tenancyQuery = createQuery({
        data: { id: "tenancy-1" },
        error: null,
      });
      const insertQuery = createQuery({
        data: { id: "deposit-1", tenancy_id: "tenancy-1" },
        error: null,
      });
      const supabase = createQueuedSupabaseMock({
        tenancies: [tenancyQuery],
        deposit_registrations: [insertQuery],
      });

      await createDepositRegistration(supabase as never, {
        tenancy_id: "tenancy-1",
        landlord_id: "client-supplied-landlord",
        amount: 1200,
        scheme: "DPS",
        scheme_reference: "DPS-123",
        registration_date: "2026-01-01",
        prescribed_info_sent_date: "2026-01-02",
        status: "registered",
        notes: null,
      } as never);

      expect(tenancyQuery.eq).toHaveBeenCalledWith("id", "tenancy-1");
      expect(tenancyQuery.eq).toHaveBeenCalledWith("landlord_id", "landlord-1");
      expect(insertQuery.insert).toHaveBeenCalledWith(
        expect.not.objectContaining({ landlord_id: expect.anything() }),
      );
    });
  });

  describe("getDepositByTenancy", () => {
    it("checks the requested tenancy belongs to the landlord before fetching by tenancy_id", async () => {
      const tenancyQuery = createQuery({
        data: { id: "tenancy-1" },
        error: null,
      });
      const depositQuery = createQuery({
        data: { id: "deposit-1", tenancy_id: "tenancy-1" },
        error: null,
      });
      const supabase = createQueuedSupabaseMock({
        tenancies: [tenancyQuery],
        deposit_registrations: [depositQuery],
      });

      await getDepositByTenancy(supabase as never, "tenancy-1");

      expect(tenancyQuery.eq).toHaveBeenCalledWith("id", "tenancy-1");
      expect(tenancyQuery.eq).toHaveBeenCalledWith("landlord_id", "landlord-1");
      expect(depositQuery.eq).toHaveBeenCalledWith("tenancy_id", "tenancy-1");
      expect(
        depositQuery.eq.mock.calls.some(([column]) => column === "landlord_id"),
      ).toBe(false);
    });
  });

  describe("updateDeposit", () => {
    it("updates only deposits attached to owned tenancies and ignores ownership fields", async () => {
      const tenanciesQuery = createQuery({
        data: [{ id: "tenancy-1" }, { id: "tenancy-2" }],
        error: null,
      });
      const updateQuery = createQuery({
        data: { id: "deposit-1", tenancy_id: "tenancy-1", status: "registered" },
        error: null,
      });
      const supabase = createQueuedSupabaseMock({
        tenancies: [tenanciesQuery],
        deposit_registrations: [updateQuery],
      });

      await updateDeposit(supabase as never, "deposit-1", {
        landlord_id: "attacker",
        tenancy_id: "foreign-tenancy",
        status: "registered",
      } as never);

      expect(updateQuery.update).toHaveBeenCalledWith(
        expect.not.objectContaining({
          landlord_id: expect.anything(),
          tenancy_id: expect.anything(),
        }),
      );
      expect(updateQuery.eq).toHaveBeenCalledWith("id", "deposit-1");
      expect(updateQuery.in).toHaveBeenCalledWith("tenancy_id", [
        "tenancy-1",
        "tenancy-2",
      ]);
      expect(
        updateQuery.eq.mock.calls.some(([column]) => column === "landlord_id"),
      ).toBe(false);
    });
  });

  describe("listDeposits", () => {
    it("lists deposits by owned tenancy IDs instead of deposit_registrations.landlord_id", async () => {
      const tenanciesQuery = createQuery({
        data: [{ id: "tenancy-1" }, { id: "tenancy-2" }],
        error: null,
      });
      const depositsQuery = createQuery({
        data: [{ id: "deposit-1", tenancy_id: "tenancy-1" }],
        error: null,
      });
      const supabase = createQueuedSupabaseMock({
        tenancies: [tenanciesQuery],
        deposit_registrations: [depositsQuery],
      });

      await listDeposits(supabase as never);

      expect(tenanciesQuery.eq).toHaveBeenCalledWith("landlord_id", "landlord-1");
      expect(depositsQuery.in).toHaveBeenCalledWith("tenancy_id", [
        "tenancy-1",
        "tenancy-2",
      ]);
      expect(
        depositsQuery.eq.mock.calls.some(([column]) => column === "landlord_id"),
      ).toBe(false);
    });
  });

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
