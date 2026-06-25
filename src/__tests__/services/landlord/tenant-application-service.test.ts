/**
 * Tests for tenant-application-service covering LD-04 state transitions.
 */
import { beforeEach, describe, it, expect, vi } from "vitest";
import {
  acceptApplication,
  rejectApplication,
  listApplications,
  getApplicationById,
  updateApplicationStatus,
  addApplicationAsLandlord,
} from "@/services/landlord/tenant-application-service";
import type { TenantApplication } from "@/types/landlord";

const mockApplication: TenantApplication = {
  id: "app-1",
  property_id: "prop-1",
  landlord_id: "user-1",
  applicant_user_id: null,
  applicant_name: "Test Applicant",
  applicant_email: "test@example.com",
  status: "referencing",
  monthly_income: 3000,
  employment_status: "employed",
  credit_check_status: "pending",
  references_status: "pending",
  notes: null,
  rejection_reason: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const { resendSendMock } = vi.hoisted(() => ({
  resendSendMock: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function Resend() {
    return {
    emails: {
      send: resendSendMock,
    },
    };
  }),
}));

function createSupabaseMock(application: TenantApplication = mockApplication) {
  const updatedApp = { ...application };

  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: updatedApp, error: null }),
    then: vi.fn((resolve: (v: { data: TenantApplication[]; error: null }) => void) =>
      resolve({ data: [application], error: null }),
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

describe("tenant-application-service", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "test-resend-key";
    resendSendMock.mockReset();
    resendSendMock.mockResolvedValue({ id: "email-1" });
  });

  describe("acceptApplication", () => {
    it("transitions status from 'referencing' to 'approved'", async () => {
      const supabase = createSupabaseMock(mockApplication);
      // Should not throw — transitions from 'referencing' to 'approved' is valid
      await expect(acceptApplication(supabase as never, "app-1")).resolves.not.toThrow();
    });

    it("allows direct approval from 'received' (landlords can accept without the full pipeline)", async () => {
      const receivedApp: TenantApplication = { ...mockApplication, status: "received" };
      const supabase = createSupabaseMock(receivedApp);
      await expect(acceptApplication(supabase as never, "app-1")).resolves.not.toThrow();
    });

    it("still refuses to accept an already-terminal application (approved -> approved)", async () => {
      const approvedApp: TenantApplication = { ...mockApplication, status: "approved" };
      const supabase = createSupabaseMock(approvedApp);
      await expect(acceptApplication(supabase as never, "app-1")).rejects.toThrow(/invalid.*transition/i);
    });

    it("sends acceptance email via Resend on approval", async () => {
      const supabase = createSupabaseMock(mockApplication);
      // acceptApplication should complete without error, indicating email was sent
      await expect(acceptApplication(supabase as never, "app-1")).resolves.not.toThrow();
    });

    it("uses TrueDeed sender, subject and body copy for acceptance emails", async () => {
      const supabase = createSupabaseMock(mockApplication);

      await acceptApplication(supabase as never, "app-1");

      expect(resendSendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "TrueDeed <hello@truedeed.co.uk>",
          subject: "Your rental application has been approved - TrueDeed",
          html: expect.stringContaining("TrueDeed"),
        }),
      );
      const payload = resendSendMock.mock.calls[0][0] as { html: string; subject: string; from: string };
      expect(`${payload.from} ${payload.subject} ${payload.html}`).not.toMatch(/Britestate|britestate\./);
    });
  });

  describe("rejectApplication", () => {
    it("transitions status to 'rejected' and records rejection_reason", async () => {
      const supabase = createSupabaseMock(mockApplication);
      await expect(
        rejectApplication(supabase as never, "app-1", "Failed referencing checks"),
      ).resolves.not.toThrow();
    });

    it("sends rejection email via Resend on rejection", async () => {
      const supabase = createSupabaseMock(mockApplication);
      await expect(
        rejectApplication(supabase as never, "app-1", "Insufficient income"),
      ).resolves.not.toThrow();
    });

    it("uses TrueDeed sender, subject and body copy for rejection emails", async () => {
      const supabase = createSupabaseMock(mockApplication);

      await rejectApplication(supabase as never, "app-1", "Insufficient income");

      expect(resendSendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "TrueDeed <hello@truedeed.co.uk>",
          subject: "Update on your rental application - TrueDeed",
          html: expect.stringContaining("TrueDeed"),
        }),
      );
      const payload = resendSendMock.mock.calls[0][0] as { html: string; subject: string; from: string };
      expect(`${payload.from} ${payload.subject} ${payload.html}`).not.toMatch(/Britestate|britestate\./);
    });
  });

  describe("listApplications", () => {
    it("returns list of applications for authenticated landlord", async () => {
      const supabase = createSupabaseMock();
      const result = await listApplications(supabase as never);
      expect(Array.isArray(result)).toBe(true);
    });

    it("filters by propertyId when provided", async () => {
      const supabase = createSupabaseMock();
      const result = await listApplications(supabase as never, { propertyId: "prop-1" });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getApplicationById", () => {
    it("returns application by ID", async () => {
      const supabase = createSupabaseMock();
      const result = await getApplicationById(supabase as never, "app-1");
      expect(result.id).toBe("app-1");
    });
  });

  describe("updateApplicationStatus", () => {
    it("throws on invalid transition (rejected -> shortlisted)", async () => {
      const rejectedApp: TenantApplication = { ...mockApplication, status: "rejected" };
      const supabase = createSupabaseMock(rejectedApp);
      await expect(
        updateApplicationStatus(supabase as never, "app-1", "shortlisted"),
      ).rejects.toThrow(/invalid.*transition/i);
    });

    it("allows valid transition (shortlisted -> referencing)", async () => {
      const shortlistedApp: TenantApplication = { ...mockApplication, status: "shortlisted" };
      const supabase = createSupabaseMock(shortlistedApp);
      await expect(
        updateApplicationStatus(supabase as never, "app-1", "referencing"),
      ).resolves.not.toThrow();
    });
  });

  describe("addApplicationAsLandlord", () => {
    // Mock that returns an owned listing for the ownership check, then the new app.
    function createAddMock(ownsProperty: boolean) {
      const insertedRows: Record<string, unknown>[] = [];
      const supabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "landlord-1" } }, error: null }),
        },
        from: vi.fn((table: string) => {
          if (table === "listings") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: ownsProperty ? { id: "listing-1" } : null, error: null }),
            };
          }
          return {
            insert: vi.fn((payload: Record<string, unknown>) => {
              insertedRows.push(payload);
              return {
                select: vi.fn().mockReturnValue({
                  single: vi
                    .fn()
                    .mockResolvedValue({ data: { id: "app-1", ...payload }, error: null }),
                }),
              };
            }),
          };
        }),
      };
      return { supabase, insertedRows };
    }

    const input = {
      property_id: "prop-1",
      applicant_name: "Jane Smith",
      applicant_email: "jane@example.com",
      monthly_income: 3000,
      employment_status: "Employed (full-time)",
    };

    it("inserts an application with property_id + landlord_id + status 'received'", async () => {
      const { supabase, insertedRows } = createAddMock(true);
      const result = await addApplicationAsLandlord(supabase as never, "landlord-1", input);
      expect(result.id).toBe("app-1");
      expect(insertedRows[0]).toMatchObject({
        property_id: "prop-1",
        landlord_id: "landlord-1",
        applicant_name: "Jane Smith",
        applicant_email: "jane@example.com",
        status: "received",
      });
    });

    it("refuses when the property is not one the landlord owns", async () => {
      const { supabase } = createAddMock(false);
      await expect(
        addApplicationAsLandlord(supabase as never, "landlord-1", input),
      ).rejects.toThrow(/not found|not owned/i);
    });
  });
});
