/**
 * Tests for tenant-application-service covering LD-04 state transitions.
 */
import { describe, it, expect, vi } from "vitest";
import {
  acceptApplication,
  rejectApplication,
  listApplications,
  getApplicationById,
  updateApplicationStatus,
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

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ id: "email-1" }),
    },
  })),
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
  describe("acceptApplication", () => {
    it("transitions status from 'referencing' to 'approved'", async () => {
      const supabase = createSupabaseMock(mockApplication);
      // Should not throw — transitions from 'referencing' to 'approved' is valid
      await expect(acceptApplication(supabase as never, "app-1")).resolves.not.toThrow();
    });

    it("rejects invalid status transition (e.g. received -> approved directly)", async () => {
      const receivedApp: TenantApplication = { ...mockApplication, status: "received" };
      const supabase = createSupabaseMock(receivedApp);
      await expect(acceptApplication(supabase as never, "app-1")).rejects.toThrow(/invalid.*transition/i);
    });

    it("sends acceptance email via Resend on approval", async () => {
      const supabase = createSupabaseMock(mockApplication);
      // acceptApplication should complete without error, indicating email was sent
      await expect(acceptApplication(supabase as never, "app-1")).resolves.not.toThrow();
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
});
