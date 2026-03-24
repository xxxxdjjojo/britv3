/**
 * provider-smart-actions-service.ts
 *
 * Rules-based engine that surfaces the most urgent action items for a provider
 * on their dashboard home. All 7 query branches run in parallel via
 * Promise.allSettled — any individual failure is silently skipped so the
 * dashboard always renders.
 *
 * Returns the top 5 SmartActions sorted by priority DESC.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type SmartActionType =
  | "expiring_lead"
  | "overdue_invoice"
  | "stale_job"
  | "unanswered_lead"
  | "unbooked_quote"
  | "missing_cert"
  | "request_review";

export type SmartAction = Readonly<{
  /** Unique action id (constructed from type + record id) */
  id: string;
  /** Higher number = shown first. Range: 1–10. */
  priority: number;
  type: SmartActionType;
  /** Short action label shown in bold */
  title: string;
  /** Supporting sentence shown below the title */
  description: string;
  /** Destination when the user taps the action */
  href: string;
  /** ISO 8601 deadline string, present for time-sensitive actions */
  deadline?: string;
}>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Days elapsed since a given ISO timestamp */
function daysSince(isoString: string): number {
  const diffMs = Date.now() - new Date(isoString).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/** Format a GBP amount from a numeric DB value (stored as pounds, not pence) */
function formatGBP(amount: number): string {
  return `£${amount.toFixed(0)}`;
}

// ---------------------------------------------------------------------------
// Query runners — each returns SmartAction[] or [] on failure
// ---------------------------------------------------------------------------

/** Priority 10 — open leads expiring within 12 hours */
async function fetchExpiringLeads(
  providerId: string,
  supabase: SupabaseClient,
): Promise<SmartAction[]> {
  const cutoff = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("service_requests")
    .select("id, category, expires_at")
    .eq("status", "open")
    .not("expires_at", "is", null)
    .lte("expires_at", cutoff)
    .limit(3);

  if (error || !data) return [];

  return (data as { id: string; category: string; expires_at: string }[]).map((row) => ({
    id: `expiring_lead:${row.id}`,
    priority: 10,
    type: "expiring_lead" as const,
    title: "Lead expiring soon",
    description: `A ${row.category ?? "service"} lead closes in under 12 hours — act now.`,
    href: "/dashboard/provider/jobs/leads",
    deadline: row.expires_at,
  }));
}

/** Priority 9 — overdue invoices */
async function fetchOverdueInvoices(
  providerId: string,
  supabase: SupabaseClient,
): Promise<SmartAction[]> {
  const { data, error } = await supabase
    .from("provider_invoices")
    .select("id, total_amount")
    .eq("provider_id", providerId)
    .eq("status", "overdue")
    .limit(5);

  if (error || !data) return [];

  return (data as { id: string; total_amount: number }[]).map((row) => ({
    id: `overdue_invoice:${row.id}`,
    priority: 9,
    type: "overdue_invoice" as const,
    title: `Overdue invoice: ${formatGBP(row.total_amount ?? 0)}`,
    description: "Chase this payment or mark it as settled to keep your accounts tidy.",
    href: "/dashboard/provider/payments",
  }));
}

/** Priority 8 — in-progress jobs running for more than 7 days */
async function fetchStaleJobs(
  providerId: string,
  supabase: SupabaseClient,
): Promise<SmartAction[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, created_at")
    .eq("provider_id", providerId)
    .eq("status", "in_progress")
    .lte("created_at", sevenDaysAgo)
    .limit(3);

  if (error || !data) return [];

  return (data as { id: string; created_at: string }[]).map((row) => {
    const days = daysSince(row.created_at);
    return {
      id: `stale_job:${row.id}`,
      priority: 8,
      type: "stale_job" as const,
      title: `Job running for ${days} days`,
      description: "Mark this job complete or update its status to keep clients informed.",
      href: "/dashboard/provider/jobs/active",
    };
  });
}

/** Priority 7 — open leads not expiring soon */
async function fetchUnansweredLeads(
  providerId: string,
  supabase: SupabaseClient,
): Promise<SmartAction[]> {
  const cutoff = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("service_requests")
    .select("id, category")
    .eq("status", "open")
    .gt("expires_at", cutoff)
    .limit(3);

  if (error || !data) return [];

  return (data as { id: string; category: string }[]).map((row) => ({
    id: `unanswered_lead:${row.id}`,
    priority: 7,
    type: "unanswered_lead" as const,
    title: `New lead: ${row.category ?? "Service request"}`,
    description: "Submit a quote before another provider gets there first.",
    href: "/dashboard/provider/jobs/leads",
  }));
}

/** Priority 6 — accepted quotes with no corresponding booking */
async function fetchUnbookedQuotes(
  providerId: string,
  supabase: SupabaseClient,
): Promise<SmartAction[]> {
  const { data, error } = await supabase
    .from("quotes")
    .select("id")
    .eq("provider_id", providerId)
    .eq("status", "accepted")
    .is("booking_id", null)
    .limit(5);

  if (error || !data) return [];

  return (data as { id: string }[]).map((row) => ({
    id: `unbooked_quote:${row.id}`,
    priority: 6,
    type: "unbooked_quote" as const,
    title: "Schedule job from accepted quote",
    description: "Convert this accepted quote into a confirmed booking to secure the work.",
    href: "/dashboard/provider/quotes",
  }));
}

/** Priority 5 — completed bookings missing certificates */
async function fetchMissingCerts(
  providerId: string,
  supabase: SupabaseClient,
): Promise<SmartAction[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("id")
    .eq("provider_id", providerId)
    .eq("status", "completed")
    .is("certificate_id", null)
    .limit(5);

  if (error || !data) return [];

  return (data as { id: string }[]).map((row) => ({
    id: `missing_cert:${row.id}`,
    priority: 5,
    type: "missing_cert" as const,
    title: "Add certificate for completed job",
    description: "Upload the relevant certificate to close out this job fully.",
    href: `/dashboard/provider/jobs/${row.id}/certificates`,
  }));
}

/** Priority 4 — completed bookings older than 3 days without a review request */
async function fetchReviewRequests(
  providerId: string,
  supabase: SupabaseClient,
): Promise<SmartAction[]> {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, created_at")
    .eq("provider_id", providerId)
    .eq("status", "completed")
    .lte("created_at", threeDaysAgo)
    .limit(3);

  if (error || !data) return [];

  return (data as { id: string; created_at: string }[]).map((row) => ({
    id: `request_review:${row.id}`,
    priority: 4,
    type: "request_review" as const,
    title: "Request review from client",
    description: "A positive review boosts your visibility and trust score.",
    href: "/dashboard/provider/reviews",
  }));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches and ranks smart action suggestions for the provider dashboard.
 *
 * Runs 7 independent queries in parallel; any failure is silently swallowed.
 * Returns the top 5 actions sorted by priority DESC.
 */
export async function getSmartActions(
  providerId: string,
  supabase: SupabaseClient,
): Promise<SmartAction[]> {
  const results = await Promise.allSettled([
    fetchExpiringLeads(providerId, supabase),
    fetchOverdueInvoices(providerId, supabase),
    fetchStaleJobs(providerId, supabase),
    fetchUnansweredLeads(providerId, supabase),
    fetchUnbookedQuotes(providerId, supabase),
    fetchMissingCerts(providerId, supabase),
    fetchReviewRequests(providerId, supabase),
  ]);

  const allActions: SmartAction[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      allActions.push(...result.value);
    }
    // Rejected promises are silently skipped
  }

  // Sort by priority DESC, take top 5
  allActions.sort((a, b) => b.priority - a.priority);
  return allActions.slice(0, 5);
}
