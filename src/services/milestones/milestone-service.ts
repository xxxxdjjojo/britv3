/**
 * Milestone service -- CRUD operations for transaction and service job milestones.
 * Transaction milestones track the 8-step UK property pipeline.
 * Service job milestones track the 5-step job lifecycle.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MilestoneStatus,
  TransactionMilestone,
  ServiceJobMilestone,
} from "@/types/milestones";
import {
  TRANSACTION_MILESTONE_TEMPLATE,
  SERVICE_JOB_MILESTONE_TEMPLATE,
} from "@/types/milestones";
import { createPlatformEvent } from "@/services/notifications/notification-service";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const updateMilestoneSchema = z.object({
  status: z.enum(["not_started", "in_progress", "completed"]),
  notes: z.string().max(500).optional(),
  completed_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/, "Must be an ISO date string")
    .optional(),
});

export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;

// ---------------------------------------------------------------------------
// Progress types
// ---------------------------------------------------------------------------

export type MilestoneProgress = Readonly<{
  completed: number;
  total: number;
  percentage: number;
}>;

// ---------------------------------------------------------------------------
// Transaction milestones
// ---------------------------------------------------------------------------

/**
 * Initialize 8 transaction milestones for a new transaction.
 * All start with status 'not_started'.
 */
export async function initializeTransactionMilestones(
  supabase: SupabaseClient,
  transactionId: string,
): Promise<TransactionMilestone[]> {
  const rows = TRANSACTION_MILESTONE_TEMPLATE.map((t) => ({
    transaction_id: transactionId,
    milestone_key: t.key,
    status: "not_started" as const,
    notes: null,
    completed_date: null,
  }));

  const { data, error } = await supabase
    .from("transaction_milestones")
    .insert(rows)
    .select();

  if (error) {
    throw new Error(
      `Failed to initialize transaction milestones: ${error.message}`,
    );
  }

  return data as TransactionMilestone[];
}

/**
 * Get all milestones for a transaction, ordered by the template order.
 */
export async function getTransactionMilestones(
  supabase: SupabaseClient,
  transactionId: string,
): Promise<TransactionMilestone[]> {
  const { data, error } = await supabase
    .from("transaction_milestones")
    .select("*")
    .eq("transaction_id", transactionId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(
      `Failed to fetch transaction milestones: ${error.message}`,
    );
  }

  // Sort by template order (milestone_key position in template)
  const orderMap = new Map(
    TRANSACTION_MILESTONE_TEMPLATE.map((t) => [t.key, t.order]),
  );

  return ((data ?? []) as TransactionMilestone[]).sort(
    (a, b) => (orderMap.get(a.milestone_key) ?? 0) - (orderMap.get(b.milestone_key) ?? 0),
  );
}

/**
 * Update a transaction milestone's status and/or notes.
 * Sets completed_date when status changes to 'completed'.
 * Clears completed_date when status changes to 'in_progress'.
 * Creates a platform event for milestone_updated.
 */
export async function updateTransactionMilestone(
  supabase: SupabaseClient,
  milestoneId: string,
  userId: string,
  input: UpdateMilestoneInput,
): Promise<TransactionMilestone> {
  const updateData: Record<string, unknown> = {
    status: input.status,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };

  if (input.notes !== undefined) {
    updateData.notes = input.notes;
  }

  if (input.status === "completed") {
    updateData.completed_date =
      input.completed_date ?? new Date().toISOString().split("T")[0];
  } else if (input.status === "in_progress") {
    updateData.completed_date = null;
  }

  const { data, error } = await supabase
    .from("transaction_milestones")
    .update(updateData)
    .eq("id", milestoneId)
    .select()
    .single();

  if (error) {
    throw new Error(
      `Failed to update transaction milestone: ${error.message}`,
    );
  }

  const milestone = data as TransactionMilestone;

  // Create platform event for notification
  await createPlatformEvent(supabase, {
    event_type: "milestone_updated",
    entity_type: "transaction",
    entity_id: milestone.transaction_id,
    actor_id: userId,
    metadata: {
      milestone_key: milestone.milestone_key,
      status: input.status,
    },
  });

  return milestone;
}

/**
 * Get progress summary for a transaction.
 */
export async function getTransactionProgress(
  supabase: SupabaseClient,
  transactionId: string,
): Promise<MilestoneProgress> {
  const milestones = await getTransactionMilestones(supabase, transactionId);
  const completed = milestones.filter((m) => m.status === "completed").length;
  const total = TRANSACTION_MILESTONE_TEMPLATE.length;

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 1000) / 10 : 0,
  };
}

// ---------------------------------------------------------------------------
// Service job milestones
// ---------------------------------------------------------------------------

/**
 * Initialize 5 service job milestones for a new booking.
 * All start with status 'not_started'.
 */
export async function initializeJobMilestones(
  supabase: SupabaseClient,
  bookingId: string,
): Promise<ServiceJobMilestone[]> {
  const rows = SERVICE_JOB_MILESTONE_TEMPLATE.map((t) => ({
    booking_id: bookingId,
    milestone_key: t.key,
    status: "not_started" as const,
    notes: null,
  }));

  const { data, error } = await supabase
    .from("service_job_milestones")
    .insert(rows)
    .select();

  if (error) {
    throw new Error(
      `Failed to initialize job milestones: ${error.message}`,
    );
  }

  return data as ServiceJobMilestone[];
}

/**
 * Get all milestones for a service job, ordered by the template order.
 */
export async function getJobMilestones(
  supabase: SupabaseClient,
  bookingId: string,
): Promise<ServiceJobMilestone[]> {
  const { data, error } = await supabase
    .from("service_job_milestones")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch job milestones: ${error.message}`);
  }

  const orderMap = new Map(
    SERVICE_JOB_MILESTONE_TEMPLATE.map((t) => [t.key, t.order]),
  );

  return ((data ?? []) as ServiceJobMilestone[]).sort(
    (a, b) => (orderMap.get(a.milestone_key) ?? 0) - (orderMap.get(b.milestone_key) ?? 0),
  );
}

/**
 * Update a service job milestone's status and/or notes.
 * Creates a platform event for milestone_updated.
 */
export async function updateJobMilestone(
  supabase: SupabaseClient,
  milestoneId: string,
  userId: string,
  input: UpdateMilestoneInput,
): Promise<ServiceJobMilestone> {
  const updateData: Record<string, unknown> = {
    status: input.status,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };

  if (input.notes !== undefined) {
    updateData.notes = input.notes;
  }

  // Service job milestones don't have completed_date in the type,
  // but we track completion via status

  const { data, error } = await supabase
    .from("service_job_milestones")
    .update(updateData)
    .eq("id", milestoneId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update job milestone: ${error.message}`);
  }

  const milestone = data as ServiceJobMilestone;

  // Create platform event for notification
  await createPlatformEvent(supabase, {
    event_type: "milestone_updated",
    entity_type: "booking",
    entity_id: milestone.booking_id,
    actor_id: userId,
    metadata: {
      milestone_key: milestone.milestone_key,
      status: input.status,
    },
  });

  return milestone;
}

/**
 * Get progress summary for a service job.
 */
export async function getJobProgress(
  supabase: SupabaseClient,
  bookingId: string,
): Promise<MilestoneProgress> {
  const milestones = await getJobMilestones(supabase, bookingId);
  const completed = milestones.filter((m) => m.status === "completed").length;
  const total = SERVICE_JOB_MILESTONE_TEMPLATE.length;

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 1000) / 10 : 0,
  };
}
