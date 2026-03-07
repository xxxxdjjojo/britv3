import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";

// ---------------------------------------------------------------------------
// Mock modules before importing services
// ---------------------------------------------------------------------------

vi.mock("@/services/notifications/notification-service", () => ({
  createPlatformEvent: vi.fn().mockResolvedValue({
    id: 1,
    event_type: "milestone_updated",
    entity_type: "transaction",
    entity_id: "txn-1",
    actor_id: "user-1",
    metadata: {},
    created_at: new Date(),
    actor_name: null,
  }),
}));

import {
  initializeTransactionMilestones,
  initializeJobMilestones,
  getTransactionMilestones,
  updateTransactionMilestone,
  getTransactionProgress,
  getJobProgress,
} from "@/services/milestones/milestone-service";
import { createPlatformEvent } from "@/services/notifications/notification-service";
import {
  TRANSACTION_MILESTONE_TEMPLATE,
  SERVICE_JOB_MILESTONE_TEMPLATE,
} from "@/types/milestones";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockMilestones(
  template: ReadonlyArray<{ key: string; order: number }>,
  overrides: Record<string, string> = {},
) {
  return template.map((t, i) => ({
    id: `ms-${i + 1}`,
    milestone_key: t.key,
    status: overrides[t.key] ?? "not_started",
    notes: null,
    completed_date: null,
    updated_by: null,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("milestone-service", () => {
  let supabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    supabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // initializeTransactionMilestones
  // -------------------------------------------------------------------------

  describe("initializeTransactionMilestones", () => {
    it("creates 8 rows with not_started status", async () => {
      const mockRows = TRANSACTION_MILESTONE_TEMPLATE.map((t, i) => ({
        id: `ms-${i + 1}`,
        transaction_id: "txn-1",
        milestone_key: t.key,
        status: "not_started",
        notes: null,
        completed_date: null,
      }));

      const builder = supabase.from("transaction_milestones");
      // Chain: insert().select() -> resolves with data
      builder.select.mockResolvedValue({ data: mockRows, error: null });

      const result = await initializeTransactionMilestones(
        supabase as never,
        "txn-1",
      );

      // Verify insert was called
      expect(builder.insert).toHaveBeenCalledTimes(1);
      const insertArg = builder.insert.mock.calls[0][0] as Array<{
        transaction_id: string;
        milestone_key: string;
        status: string;
      }>;
      expect(insertArg).toHaveLength(8);
      expect(insertArg.every((r: { status: string }) => r.status === "not_started")).toBe(true);

      // Verify result
      expect(result).toHaveLength(8);
    });
  });

  // -------------------------------------------------------------------------
  // initializeJobMilestones
  // -------------------------------------------------------------------------

  describe("initializeJobMilestones", () => {
    it("creates 5 rows with not_started status", async () => {
      const mockRows = SERVICE_JOB_MILESTONE_TEMPLATE.map((t, i) => ({
        id: `jm-${i + 1}`,
        booking_id: "bk-1",
        milestone_key: t.key,
        status: "not_started",
        notes: null,
      }));

      const builder = supabase.from("service_job_milestones");
      builder.select.mockResolvedValue({ data: mockRows, error: null });

      const result = await initializeJobMilestones(supabase as never, "bk-1");

      const insertArg = builder.insert.mock.calls[0][0] as Array<{
        booking_id: string;
        milestone_key: string;
        status: string;
      }>;
      expect(insertArg).toHaveLength(5);
      expect(insertArg.every((r: { status: string }) => r.status === "not_started")).toBe(true);
      expect(result).toHaveLength(5);
    });
  });

  // -------------------------------------------------------------------------
  // getTransactionMilestones
  // -------------------------------------------------------------------------

  describe("getTransactionMilestones", () => {
    it("returns milestones ordered by template order", async () => {
      // Return in scrambled order
      const scrambled = [
        { id: "ms-3", milestone_key: "survey_instructed", status: "not_started", notes: null, completed_date: null, transaction_id: "txn-1" },
        { id: "ms-1", milestone_key: "offer_accepted", status: "completed", notes: null, completed_date: "2026-01-15", transaction_id: "txn-1" },
        { id: "ms-2", milestone_key: "mortgage_submitted", status: "in_progress", notes: null, completed_date: null, transaction_id: "txn-1" },
      ];

      const builder = supabase.from("transaction_milestones");
      // Chain: select().eq().order() -> thenable resolves
      builder.order.mockImplementation(() => ({
        then: (resolve: (v: { data: typeof scrambled; error: null }) => void) =>
          resolve({ data: scrambled, error: null }),
      }));

      const result = await getTransactionMilestones(supabase as never, "txn-1");

      // Should be sorted: offer_accepted (1), mortgage_submitted (2), survey_instructed (3)
      expect(result[0].milestone_key).toBe("offer_accepted");
      expect(result[1].milestone_key).toBe("mortgage_submitted");
      expect(result[2].milestone_key).toBe("survey_instructed");
    });
  });

  // -------------------------------------------------------------------------
  // updateTransactionMilestone
  // -------------------------------------------------------------------------

  describe("updateTransactionMilestone", () => {
    it("changes status and creates platform event", async () => {
      const updatedRow = {
        id: "ms-1",
        transaction_id: "txn-1",
        milestone_key: "offer_accepted",
        status: "in_progress",
        notes: null,
        completed_date: null,
        updated_by: "user-1",
      };

      const builder = supabase.from("transaction_milestones");
      builder.single.mockResolvedValue({ data: updatedRow, error: null });

      await updateTransactionMilestone(supabase as never, "ms-1", "user-1", {
        status: "in_progress",
      });

      // Verify update was called
      expect(builder.update).toHaveBeenCalledTimes(1);

      // Verify platform event was created
      expect(createPlatformEvent).toHaveBeenCalledTimes(1);
      expect(createPlatformEvent).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          event_type: "milestone_updated",
          entity_type: "transaction",
          entity_id: "txn-1",
          actor_id: "user-1",
        }),
      );
    });

    it("sets completed_date when status changes to completed", async () => {
      const updatedRow = {
        id: "ms-1",
        transaction_id: "txn-1",
        milestone_key: "offer_accepted",
        status: "completed",
        notes: null,
        completed_date: "2026-03-07",
        updated_by: "user-1",
      };

      const builder = supabase.from("transaction_milestones");
      builder.single.mockResolvedValue({ data: updatedRow, error: null });

      await updateTransactionMilestone(supabase as never, "ms-1", "user-1", {
        status: "completed",
      });

      const updateArg = builder.update.mock.calls[0][0] as Record<string, unknown>;
      expect(updateArg.status).toBe("completed");
      expect(updateArg.completed_date).toBeTruthy();
      expect(typeof updateArg.completed_date).toBe("string");
    });

    it("clears completed_date when status changes to in_progress", async () => {
      const updatedRow = {
        id: "ms-1",
        transaction_id: "txn-1",
        milestone_key: "offer_accepted",
        status: "in_progress",
        notes: null,
        completed_date: null,
        updated_by: "user-1",
      };

      const builder = supabase.from("transaction_milestones");
      builder.single.mockResolvedValue({ data: updatedRow, error: null });

      await updateTransactionMilestone(supabase as never, "ms-1", "user-1", {
        status: "in_progress",
      });

      const updateArg = builder.update.mock.calls[0][0] as Record<string, unknown>;
      expect(updateArg.status).toBe("in_progress");
      expect(updateArg.completed_date).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // getTransactionProgress
  // -------------------------------------------------------------------------

  describe("getTransactionProgress", () => {
    it("returns correct percentage (e.g. 3/8 = 37.5%)", async () => {
      const milestones = createMockMilestones(
        TRANSACTION_MILESTONE_TEMPLATE,
        {
          offer_accepted: "completed",
          mortgage_submitted: "completed",
          survey_instructed: "completed",
        },
      );

      const builder = supabase.from("transaction_milestones");
      builder.order.mockImplementation(() => ({
        then: (resolve: (v: { data: typeof milestones; error: null }) => void) =>
          resolve({ data: milestones, error: null }),
      }));

      const progress = await getTransactionProgress(supabase as never, "txn-1");

      expect(progress.completed).toBe(3);
      expect(progress.total).toBe(8);
      expect(progress.percentage).toBe(37.5);
    });
  });

  // -------------------------------------------------------------------------
  // getJobProgress
  // -------------------------------------------------------------------------

  describe("getJobProgress", () => {
    it("returns correct percentage (e.g. 2/5 = 40%)", async () => {
      const milestones = createMockMilestones(
        SERVICE_JOB_MILESTONE_TEMPLATE,
        {
          quote_accepted: "completed",
          job_scheduled: "completed",
        },
      );

      const builder = supabase.from("service_job_milestones");
      builder.order.mockImplementation(() => ({
        then: (resolve: (v: { data: typeof milestones; error: null }) => void) =>
          resolve({ data: milestones, error: null }),
      }));

      const progress = await getJobProgress(supabase as never, "bk-1");

      expect(progress.completed).toBe(2);
      expect(progress.total).toBe(5);
      expect(progress.percentage).toBe(40);
    });
  });
});
