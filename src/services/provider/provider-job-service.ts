/**
 * provider-job-service.ts
 *
 * Lead management, active jobs, completed jobs, and job detail for the
 * provider dashboard. All functions accept a SupabaseClient as a parameter
 * so they work in both server and client contexts.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export type ProviderLead = Readonly<{
  /** Lead (service_request) id */
  id: string;
  /** Client display name (anonymised until accepted) */
  clientName: string;
  /** Service category, e.g. "Plumbing", "Electrical" */
  serviceCategory: string;
  /** Short description of work required */
  description: string;
  /** Town / city of the job */
  location: string;
  /**
   * Lead status:
   * 'new' | 'accepted' | 'declined' | 'expired' | 'converted'
   */
  status: string;
  /** Estimated budget range in pence (null if not provided) */
  budgetMinPence: number | null;
  budgetMaxPence: number | null;
  /** ISO 8601 timestamp when the lead was created */
  createdAt: string;
  /** ISO 8601 expiry timestamp (leads expire after 48h) */
  expiresAt: string;
}>;

export type ActiveJob = Readonly<{
  /** Booking id */
  id: string;
  /** Service request title */
  title: string;
  /** Client display name */
  clientName: string;
  /** Booking status: 'confirmed' | 'in_progress' */
  status: string;
  /** Scheduled date (ISO 8601) */
  scheduledDate: string | null;
  /** Total amount in pence */
  totalAmountPence: number;
  /** Number of days since booking was created */
  daysRunning: number;
}>;

export type CompletedJob = Readonly<{
  /** Booking id */
  id: string;
  /** Service request title */
  title: string;
  /** Client display name */
  clientName: string;
  /** Completion date-time (ISO 8601) */
  completedAt: string;
  /** Total amount in pence */
  totalAmountPence: number;
  /** Overall review rating (null if no review) */
  rating: number | null;
}>;

export type PaginatedCompletedJobs = Readonly<{
  data: CompletedJob[];
  total: number;
  page: number;
  pageSize: number;
}>;

export type JobTimelineEntry = Readonly<{
  /** ISO 8601 timestamp */
  at: string;
  /** Human-readable label */
  label: string;
}>;

export type JobDetailClient = Readonly<{
  id: string;
  name: string;
  email: string;
  phone: string | null;
}>;

export type JobDetailAddress = Readonly<{
  line1: string;
  city: string;
  postcode: string;
}>;

export type JobDetail = Readonly<{
  /** Booking id */
  id: string;
  /** Status: 'active' | 'completed' | 'cancelled' | 'disputed' */
  status: string;
  /** Service type label */
  serviceType: string;
  /** Full description of work */
  description: string;
  /** Client information */
  client: JobDetailClient;
  /** Property / site address */
  address: JobDetailAddress;
  /** Agreed price in pence (null until quote accepted) */
  agreedPricePence: number | null;
  /** Scheduled start date-time (ISO 8601) */
  scheduledAt: string | null;
  /** Completion date-time (ISO 8601, null if not completed) */
  completedAt: string | null;
  /** Array of uploaded photos/documents */
  attachments: string[];
  /** Timeline of status changes */
  timeline: JobTimelineEntry[];
  /** ISO 8601 creation timestamp */
  createdAt: string;
}>;

export type AcceptLeadResult = Readonly<{
  /** Newly created / associated job id */
  jobId: string;
  /** Source lead id */
  leadId: string;
  /** Job status after acceptance */
  status: "active";
  /** ISO 8601 timestamp */
  acceptedAt: string;
}>;

export type DeclineLeadResult = Readonly<{
  leadId: string;
  status: "declined";
  /** ISO 8601 timestamp */
  declinedAt: string;
  /** Reason for declining */
  declineReason: string;
}>;

export type LeadFilters = Readonly<{
  category?: string;
  urgency?: string;
}>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a numeric DB value (stored as numeric/decimal) to pence (integer). */
function toPence(value: number | null | undefined): number | null {
  if (value == null) return null;
  return Math.round(value * 100);
}

/** Compute days elapsed since a given ISO timestamp. */
function daysElapsed(isoTimestamp: string): number {
  const ms = Date.now() - new Date(isoTimestamp).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

/** Derive booking status display string. */
function bookingStatusDisplay(status: string): string {
  if (status === "in_progress") return "active";
  if (status === "confirmed") return "active";
  return status;
}

// ---------------------------------------------------------------------------
// getProviderLeads
// ---------------------------------------------------------------------------

/**
 * Returns open service_requests matching the provider's service categories.
 * Excludes expired leads (> 48h old with status 'open').
 * Falls back to [] on any database error.
 */
export async function getProviderLeads(
  providerId: string,
  supabase: SupabaseClient,
  filters?: LeadFilters,
): Promise<ProviderLead[]> {
  try {
    // 1. Fetch provider's service categories
    const { data: providerData, error: providerError } = await supabase
      .from("service_provider_details")
      .select("services")
      .eq("user_id", providerId)
      .maybeSingle();

    if (providerError || !providerData) return [];

    const services: string[] = (providerData as { services: string[] }).services ?? [];
    if (services.length === 0) return [];

    // 2. Cutoff: 48h ago (leads older than this are considered expired)
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // 3. Query open service_requests matching provider's categories
    let query = supabase
      .from("service_requests")
      .select(
        `
        id,
        client_id,
        category,
        title,
        description,
        budget_range_min,
        budget_range_max,
        postcode,
        urgency_level,
        status,
        created_at
      `,
      )
      .eq("status", "open")
      .in("category", services)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false });

    if (filters?.category) {
      query = query.eq("category", filters.category);
    }
    if (filters?.urgency) {
      query = query.eq("urgency_level", filters.urgency);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    // 4. Map to ProviderLead shape
    return (data as Array<Record<string, unknown>>).map((row): ProviderLead => {
      const createdAt = row["created_at"] as string;
      const expiresAt = new Date(
        new Date(createdAt).getTime() + 48 * 60 * 60 * 1000,
      ).toISOString();

      return {
        id: row["id"] as string,
        clientName: "Client",
        serviceCategory: row["category"] as string,
        description: (row["description"] as string | null) ?? "",
        location: (row["postcode"] as string | null) ?? "",
        status: "new",
        budgetMinPence: toPence(row["budget_range_min"] as number | null),
        budgetMaxPence: toPence(row["budget_range_max"] as number | null),
        createdAt,
        expiresAt,
      };
    });
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// getActiveJobs
// ---------------------------------------------------------------------------

/**
 * Returns confirmed/in_progress bookings for the provider, enriched with
 * service_request title and computed daysRunning. Falls back to [] on error.
 */
export async function getActiveJobs(
  supabase: SupabaseClient,
  providerId: string,
): Promise<ActiveJob[]> {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
        id,
        status,
        scheduled_date,
        total_amount,
        created_at,
        service_requests (
          title,
          category
        ),
        profiles:client_id (
          full_name
        )
      `,
      )
      .eq("provider_id", providerId)
      .in("status", ["confirmed", "in_progress"])
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return (data as Array<Record<string, unknown>>).map((row): ActiveJob => {
      const sr = Array.isArray(row["service_requests"])
        ? (row["service_requests"][0] as Record<string, unknown> | undefined)
        : (row["service_requests"] as Record<string, unknown> | undefined);
      const profile = Array.isArray(row["profiles"])
        ? (row["profiles"][0] as Record<string, unknown> | undefined)
        : (row["profiles"] as Record<string, unknown> | undefined);

      return {
        id: row["id"] as string,
        title: (sr?.["title"] as string | undefined) ?? "Job",
        clientName: (profile?.["full_name"] as string | undefined) ?? "Client",
        status: bookingStatusDisplay(row["status"] as string),
        scheduledDate: (row["scheduled_date"] as string | null) ?? null,
        totalAmountPence: Math.round(((row["total_amount"] as number | null) ?? 0) * 100),
        daysRunning: daysElapsed(row["created_at"] as string),
      };
    });
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// getCompletedJobs
// ---------------------------------------------------------------------------

/**
 * Returns paginated completed bookings for the provider.
 * Supports optional text search on service_request title.
 */
export async function getCompletedJobs(
  supabase: SupabaseClient,
  providerId: string,
  search?: string,
  page = 1,
  pageSize = 20,
): Promise<PaginatedCompletedJobs> {
  const empty: PaginatedCompletedJobs = { data: [], total: 0, page, pageSize };

  try {
    const offset = (page - 1) * pageSize;

    const query = supabase
      .from("bookings")
      .select(
        `
        id,
        status,
        total_amount,
        created_at,
        service_requests (
          title
        ),
        profiles:client_id (
          full_name
        ),
        reviews!reviews_booking_id_fkey (
          overall_rating
        )
      `,
        { count: "exact" },
      )
      .eq("provider_id", providerId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    // Text search filtering applied after fetch for simplicity
    const { data, error, count } = await query;

    if (error || !data) return empty;

    let rows = data as Array<Record<string, unknown>>;

    // Filter by search term if provided
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      rows = rows.filter((row) => {
        const sr = Array.isArray(row["service_requests"])
          ? (row["service_requests"][0] as Record<string, unknown> | undefined)
          : (row["service_requests"] as Record<string, unknown> | undefined);
        const title = ((sr?.["title"] as string | undefined) ?? "").toLowerCase();
        return title.includes(term);
      });
    }

    const jobs = rows.map((row): CompletedJob => {
      const sr = Array.isArray(row["service_requests"])
        ? (row["service_requests"][0] as Record<string, unknown> | undefined)
        : (row["service_requests"] as Record<string, unknown> | undefined);
      const profile = Array.isArray(row["profiles"])
        ? (row["profiles"][0] as Record<string, unknown> | undefined)
        : (row["profiles"] as Record<string, unknown> | undefined);
      const reviewArr = Array.isArray(row["reviews"]) ? row["reviews"] : [];
      const review = reviewArr[0] as Record<string, unknown> | undefined;

      return {
        id: row["id"] as string,
        title: (sr?.["title"] as string | undefined) ?? "Job",
        clientName: (profile?.["full_name"] as string | undefined) ?? "Client",
        completedAt: row["created_at"] as string,
        totalAmountPence: Math.round(((row["total_amount"] as number | null) ?? 0) * 100),
        rating: (review?.["overall_rating"] as number | null) ?? null,
      };
    });

    return { data: jobs, total: count ?? jobs.length, page, pageSize };
  } catch {
    return empty;
  }
}

// ---------------------------------------------------------------------------
// getJobDetail
// ---------------------------------------------------------------------------

/**
 * Returns the full detail for a booking. Returns null if the booking does not
 * exist. Throws an authorization error if the booking belongs to a different
 * provider.
 */
export async function getJobDetail(
  jobId: string,
  providerId: string,
  supabase: SupabaseClient,
): Promise<JobDetail | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      provider_id,
      status,
      scheduled_date,
      total_amount,
      created_at,
      service_requests (
        title,
        category,
        description,
        postcode,
        client_id
      ),
      profiles:client_id (
        id,
        full_name,
        email,
        phone
      ),
      quotes (
        total_amount
      ),
      provider_invoices!provider_invoices_booking_id_fkey (
        id,
        status
      ),
      reviews!reviews_booking_id_fkey (
        overall_rating,
        comment,
        created_at
      )
    `,
    )
    .eq("id", jobId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch job detail: ${error.message}`);
  }

  if (!data) return null;

  const row = data as Record<string, unknown>;

  // Authorization check: booking must belong to this provider
  if ((row["provider_id"] as string) !== providerId) {
    throw new Error("Authorization error: this job belongs to a different provider");
  }

  const sr = Array.isArray(row["service_requests"])
    ? (row["service_requests"][0] as Record<string, unknown> | undefined)
    : (row["service_requests"] as Record<string, unknown> | undefined);
  const profile = Array.isArray(row["profiles"])
    ? (row["profiles"][0] as Record<string, unknown> | undefined)
    : (row["profiles"] as Record<string, unknown> | undefined);
  const quoteArr = Array.isArray(row["quotes"]) ? row["quotes"] : [];
  const quote = quoteArr[0] as Record<string, unknown> | undefined;

  // Build timeline from booking created_at
  const createdAt = row["created_at"] as string;
  const timeline: JobTimelineEntry[] = [{ at: createdAt, label: "Job created" }];

  const status = row["status"] as string;
  if (status === "confirmed" || status === "in_progress" || status === "completed") {
    timeline.push({ at: createdAt, label: "Job confirmed" });
  }
  if (status === "in_progress" || status === "completed") {
    timeline.push({ at: createdAt, label: "Work in progress" });
  }
  if (status === "completed") {
    timeline.push({ at: createdAt, label: "Job completed" });
  }

  const agreedPricePence = quote?.["total_amount"] != null
    ? Math.round((quote["total_amount"] as number) * 100)
    : null;

  return {
    id: row["id"] as string,
    status: bookingStatusDisplay(status),
    serviceType: (sr?.["category"] as string | undefined) ?? "Service",
    description: (sr?.["description"] as string | undefined) ?? "",
    client: {
      id: (profile?.["id"] as string | undefined) ?? (sr?.["client_id"] as string | undefined) ?? "",
      name: (profile?.["full_name"] as string | undefined) ?? "Client",
      email: (profile?.["email"] as string | undefined) ?? "",
      phone: (profile?.["phone"] as string | null | undefined) ?? null,
    },
    address: {
      line1: "",
      city: "",
      postcode: (sr?.["postcode"] as string | undefined) ?? "",
    },
    agreedPricePence,
    scheduledAt: (row["scheduled_date"] as string | null) ?? null,
    completedAt: status === "completed" ? createdAt : null,
    attachments: [],
    timeline,
    createdAt,
  };
}

// ---------------------------------------------------------------------------
// acceptLead
// ---------------------------------------------------------------------------

/**
 * Accepts an open service_request lead for the provider.
 * Validates that the provider's service categories match the request category.
 * Throws if the lead doesn't belong to provider's categories, is already
 * accepted/cancelled, or doesn't exist.
 */
export async function acceptLead(
  leadId: string,
  providerId: string,
  supabase: SupabaseClient,
): Promise<AcceptLeadResult> {
  // 1. Fetch the service request
  const { data: reqData, error: reqError } = await supabase
    .from("service_requests")
    .select("id, category, status, client_id")
    .eq("id", leadId)
    .maybeSingle();

  if (reqError) throw new Error(`Failed to fetch lead: ${reqError.message}`);
  if (!reqData) throw new Error("Lead not found");

  const req = reqData as Record<string, unknown>;

  if (req["status"] !== "open") {
    throw new Error(`Lead cannot be accepted: current status is '${req["status"] as string}'`);
  }

  // 2. Validate provider owns a matching category
  const { data: providerData, error: providerError } = await supabase
    .from("service_provider_details")
    .select("services")
    .eq("user_id", providerId)
    .maybeSingle();

  if (providerError) throw new Error(`Failed to fetch provider details: ${providerError.message}`);
  if (!providerData) throw new Error("Provider not found");

  const services: string[] =
    (providerData as { services: string[] }).services ?? [];
  const category = req["category"] as string;

  if (!services.includes(category)) {
    throw new Error(
      `Lead category '${category}' does not match provider's registered services`,
    );
  }

  // 3. Update service_request status to 'accepted'
  const acceptedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("service_requests")
    .update({ status: "accepted" })
    .eq("id", leadId);

  if (updateError) throw new Error(`Failed to accept lead: ${updateError.message}`);

  // 4. Return result (jobId uses leadId as reference until booking is created)
  return {
    jobId: leadId,
    leadId,
    status: "active",
    acceptedAt,
  };
}

// ---------------------------------------------------------------------------
// declineLead
// ---------------------------------------------------------------------------

/**
 * Declines an open service_request lead for the provider.
 * Validates provider ownership via category match.
 * Throws if lead doesn't exist or doesn't match provider's categories.
 */
export async function declineLead(
  leadId: string,
  providerId: string,
  reason: string,
  supabase: SupabaseClient,
): Promise<DeclineLeadResult> {
  // 1. Fetch the service request
  const { data: reqData, error: reqError } = await supabase
    .from("service_requests")
    .select("id, category, status")
    .eq("id", leadId)
    .maybeSingle();

  if (reqError) throw new Error(`Failed to fetch lead: ${reqError.message}`);
  if (!reqData) throw new Error("Lead not found");

  const req = reqData as Record<string, unknown>;

  // 2. Validate provider owns a matching category
  const { data: providerData, error: providerError } = await supabase
    .from("service_provider_details")
    .select("services")
    .eq("user_id", providerId)
    .maybeSingle();

  if (providerError) throw new Error(`Failed to fetch provider details: ${providerError.message}`);
  if (!providerData) throw new Error("Provider not found");

  const services: string[] =
    (providerData as { services: string[] }).services ?? [];
  const category = req["category"] as string;

  if (!services.includes(category)) {
    throw new Error(
      `Lead category '${category}' does not match provider's registered services`,
    );
  }

  // 3. Update service_request status to 'cancelled'
  const declinedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("service_requests")
    .update({ status: "cancelled" })
    .eq("id", leadId);

  if (updateError) throw new Error(`Failed to decline lead: ${updateError.message}`);

  return {
    leadId,
    status: "declined",
    declinedAt,
    declineReason: reason,
  };
}

// ---------------------------------------------------------------------------
// getUpcomingJobs
// ---------------------------------------------------------------------------

export type UpcomingJobSummary = Readonly<{
  /** Booking id */
  id: string;
  /** Client display name */
  clientName: string;
  /** Service type / category label */
  serviceType: string;
  /** ISO 8601 scheduled date-time (null if not set) */
  scheduledDate: string | null;
  /** Booking status: 'confirmed' | 'in_progress' */
  status: string;
  /** Job address (may be empty string) */
  address: string;
}>;

/**
 * Returns confirmed/in_progress bookings scheduled today or in the near future
 * for the provider, ordered by scheduled_date ascending.
 * Falls back to [] on any error.
 */
export async function getUpcomingJobs(
  providerId: string,
  limit: number,
  supabase: SupabaseClient,
): Promise<UpcomingJobSummary[]> {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
        id,
        status,
        scheduled_date,
        service_requests (
          category,
          title
        ),
        profiles:client_id (
          full_name
        ),
        properties (
          address_line1,
          city,
          postcode
        )
      `,
      )
      .eq("provider_id", providerId)
      .in("status", ["confirmed", "in_progress"])
      .gte("scheduled_date", todayStart.toISOString())
      .order("scheduled_date", { ascending: true })
      .limit(limit);

    if (error || !data) return [];

    return (data as Array<Record<string, unknown>>).map((row): UpcomingJobSummary => {
      const sr = Array.isArray(row["service_requests"])
        ? (row["service_requests"][0] as Record<string, unknown> | undefined)
        : (row["service_requests"] as Record<string, unknown> | undefined);
      const profile = Array.isArray(row["profiles"])
        ? (row["profiles"][0] as Record<string, unknown> | undefined)
        : (row["profiles"] as Record<string, unknown> | undefined);
      const property = Array.isArray(row["properties"])
        ? (row["properties"][0] as Record<string, unknown> | undefined)
        : (row["properties"] as Record<string, unknown> | undefined);

      const line1 = (property?.["address_line1"] as string | null) ?? "";
      const city = (property?.["city"] as string | null) ?? "";
      const postcode = (property?.["postcode"] as string | null) ?? "";
      const addressParts = [line1, city, postcode].filter(Boolean);
      const address = addressParts.join(", ");

      return {
        id: row["id"] as string,
        clientName: (profile?.["full_name"] as string | undefined) ?? "Client",
        serviceType:
          (sr?.["category"] as string | undefined) ??
          (sr?.["title"] as string | undefined) ??
          "Job",
        scheduledDate: (row["scheduled_date"] as string | null) ?? null,
        status: row["status"] as string,
        address,
      };
    });
  } catch {
    return [];
  }
}
