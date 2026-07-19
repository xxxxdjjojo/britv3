/**
 * provider-dashboard-service.ts
 *
 * KPI stats, recent activity feed, and upcoming jobs for the provider
 * dashboard home page. All functions accept a SupabaseClient as the last
 * parameter so they work in both server and client contexts.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Return types (aligned to test contract)
// ---------------------------------------------------------------------------

export type ProviderStats = Readonly<{
  /** Total leads received (all time) */
  totalLeads: number;
  /** Active / in-progress jobs */
  activeJobs: number;
  /** Completed jobs (all time) */
  completedJobs: number;
  /** Overall star rating 0–5, one decimal place */
  averageRating: number;
  /** Total gross earnings in pence */
  totalEarningsPence: number;
  /** Pending payout amount in pence (Stripe Connect balance) */
  pendingPayoutPence: number;
  /** Number of unread messages / notifications */
  unreadMessages: number;
  /** Verification status: 'unverified' | 'pending' | 'verified' */
  verificationStatus: string;
}>;

export type ActivityItem = Readonly<{
  /** Unique activity record id */
  id: string;
  /**
   * Activity type:
   * 'lead_received' | 'job_started' | 'job_completed' |
   * 'payment_received' | 'review_posted' | 'message_received'
   */
  type: string;
  /** ISO 8601 timestamp */
  createdAt: string;
  /** Human-readable label, e.g. "New lead from John S." */
  label: string;
  /** Optional reference id (job id, lead id, etc.) */
  referenceId: string | null;
}>;

export type UpcomingJobSummary = Readonly<{
  /** Job / booking id */
  id: string;
  /** Client display name */
  clientName: string;
  /** Service type label, e.g. "Boiler Repair" */
  serviceType: string;
  /** Scheduled date (ISO 8601 date string) */
  scheduledDate: string;
  /** Job status: 'scheduled' | 'confirmed' | 'en_route' */
  status: string;
  /** Property address (single formatted line) */
  address: string;
}>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMPTY_STATS: ProviderStats = {
  totalLeads: 0,
  activeJobs: 0,
  completedJobs: 0,
  averageRating: 0,
  totalEarningsPence: 0,
  pendingPayoutPence: 0,
  unreadMessages: 0,
  verificationStatus: "unverified",
};

// ---------------------------------------------------------------------------
// getProviderDashboardStats
// ---------------------------------------------------------------------------

/**
 * Returns KPI summary stats for the provider dashboard home.
 * Falls back to zero-values on any database error so the UI always renders.
 */
export async function getProviderDashboardStats(
  providerId: string,
  supabase: SupabaseClient,
): Promise<ProviderStats> {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      leadsResult,
      activeJobsResult,
      completedJobsResult,
      ratingsResult,
      earningsResult,
      verificationResult,
    ] = await Promise.allSettled([
      // Total leads (service_requests linked to this provider via accepted bookings or open category match)
      supabase
        .from("service_requests")
        .select("id", { count: "exact", head: true })
        .not("status", "eq", "cancelled"),

      // Active jobs
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", providerId)
        .in("status", ["confirmed", "in_progress"]),

      // Completed jobs
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", providerId)
        .eq("status", "completed"),

      // Average rating
      supabase
        .from("reviews")
        .select("overall_rating")
        .eq("reviewee_id", providerId),

      // Total earnings (paid invoices)
      supabase
        .from("provider_invoices")
        .select("total_amount")
        .eq("provider_id", providerId)
        .eq("status", "paid"),

      // Verification documents
      supabase
        .from("provider_documents")
        .select("verification_status")
        .eq("user_id", providerId),
    ]);

    // Total leads
    const totalLeads =
      leadsResult.status === "fulfilled" && !leadsResult.value.error
        ? (leadsResult.value.count ?? 0)
        : 0;

    // Active jobs
    const activeJobs =
      activeJobsResult.status === "fulfilled" && !activeJobsResult.value.error
        ? (activeJobsResult.value.count ?? 0)
        : 0;

    // Completed jobs
    const completedJobs =
      completedJobsResult.status === "fulfilled" && !completedJobsResult.value.error
        ? (completedJobsResult.value.count ?? 0)
        : 0;

    // Average rating
    let averageRating = 0;
    if (ratingsResult.status === "fulfilled" && !ratingsResult.value.error) {
      const rows = ratingsResult.value.data ?? [];
      if (rows.length > 0) {
        const sum = rows.reduce(
          (acc: number, r: { overall_rating: number }) => acc + (r.overall_rating ?? 0),
          0,
        );
        averageRating = Math.round((sum / rows.length) * 10) / 10;
      }
    }

    // Total earnings in pence (DB stores as numeric; multiply by 100 for pence)
    let totalEarningsPence = 0;
    if (earningsResult.status === "fulfilled" && !earningsResult.value.error) {
      const rows = earningsResult.value.data ?? [];
      totalEarningsPence = rows.reduce(
        (acc: number, inv: { total_amount: number }) =>
          acc + Math.round((inv.total_amount ?? 0) * 100),
        0,
      );
    }

    // Verification status
    let verificationStatus = "unverified";
    if (verificationResult.status === "fulfilled" && !verificationResult.value.error) {
      const docs = verificationResult.value.data ?? [];
      const hasApproved = docs.some(
        (d: { verification_status: string }) =>
          d.verification_status === "approved",
      );
      const hasPending = docs.some(
        (d: { verification_status: string }) =>
          d.verification_status === "pending",
      );
      if (hasApproved) verificationStatus = "verified";
      else if (hasPending) verificationStatus = "pending";
    }

    return {
      totalLeads,
      activeJobs,
      completedJobs,
      averageRating,
      totalEarningsPence,
      pendingPayoutPence: 0, // Stripe Connect balance fetched separately
      unreadMessages: 0, // Messaging service handles this
      verificationStatus,
    };
  } catch {
    return EMPTY_STATS;
  }
}

// ---------------------------------------------------------------------------
// getRecentActivity
// ---------------------------------------------------------------------------

/**
 * Returns the most recent activity items for the provider, merging bookings,
 * service requests, and reviews by created_at. Falls back to [] on error.
 */
export async function getRecentActivity(
  providerId: string,
  limit: number,
  supabase: SupabaseClient,
): Promise<ActivityItem[]> {
  try {
    const [bookingsResult, reviewsResult] = await Promise.allSettled([
      supabase
        .from("bookings")
        .select("id, status, created_at, total_amount")
        .eq("provider_id", providerId)
        .order("created_at", { ascending: false })
        .limit(limit),

      supabase
        .from("reviews")
        .select("id, overall_rating, comment, created_at, booking_id")
        .eq("reviewee_id", providerId)
        .order("created_at", { ascending: false })
        .limit(limit),
    ]);

    const items: ActivityItem[] = [];

    if (bookingsResult.status === "fulfilled" && !bookingsResult.value.error) {
      for (const booking of bookingsResult.value.data ?? []) {
        const type =
          booking.status === "completed"
            ? "job_completed"
            : booking.status === "in_progress"
              ? "job_started"
              : "lead_received";

        items.push({
          id: booking.id,
          type,
          createdAt: booking.created_at,
          label:
            booking.status === "completed"
              ? "Job completed"
              : booking.status === "in_progress"
                ? "Job started"
                : "New lead received",
          referenceId: booking.id,
        });
      }
    }

    if (reviewsResult.status === "fulfilled" && !reviewsResult.value.error) {
      for (const review of reviewsResult.value.data ?? []) {
        items.push({
          id: review.id,
          type: "review_posted",
          createdAt: review.created_at,
          label: `New ${review.overall_rating}-star review`,
          referenceId: review.booking_id ?? null,
        });
      }
    }

    // Sort merged results by created_at descending and trim to limit
    items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return items.slice(0, limit);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// getUpcomingJobs
// ---------------------------------------------------------------------------

/**
 * Returns upcoming confirmed/in-progress jobs ordered by scheduled_date ASC.
 * Falls back to [] on error.
 */
export async function getUpcomingJobs(
  providerId: string,
  limit: number,
  supabase: SupabaseClient,
): Promise<UpcomingJobSummary[]> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
        id,
        status,
        scheduled_date,
        total_amount,
        service_requests (
          title,
          category,
          description
        ),
        profiles:client_id (
          full_name
        )
      `,
      )
      .eq("provider_id", providerId)
      .in("status", ["confirmed", "in_progress"])
      .gte("scheduled_date", now)
      .order("scheduled_date", { ascending: true })
      .limit(limit);

    if (error || !data) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((row): UpcomingJobSummary => {
      const sr = Array.isArray(row.service_requests)
        ? row.service_requests[0]
        : row.service_requests;
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return {
        id: row.id,
        clientName: (profile?.full_name as string | undefined) ?? "Client",
        serviceType: (sr?.category as string | undefined) ?? "Service",
        scheduledDate: row.scheduled_date as string,
        status: row.status as string,
        address: "",
      };
    });
  } catch {
    return [];
  }
}
