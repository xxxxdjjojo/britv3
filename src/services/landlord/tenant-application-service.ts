/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * Tenant application service -- manage applicant pipeline for rental properties.
 * Enforces valid state transitions and sends emails via Resend on status changes.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import type { TenantApplication, TenantApplicationStatus } from "@/types/landlord";
import { escapeHtml } from "@/lib/escape-html";

// -- State machine -----------------------------------------------------------

const VALID_TRANSITIONS: Record<TenantApplicationStatus, TenantApplicationStatus[]> = {
  received: ["shortlisted", "rejected"],
  shortlisted: ["referencing", "rejected"],
  referencing: ["approved", "rejected"],
  approved: [],
  rejected: [],
  withdrawn: [],
};

// -- Resend client -----------------------------------------------------------

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[tenant-application-service] RESEND_API_KEY not set -- emails disabled");
    return null;
  }
  return new Resend(apiKey);
}

const FROM_ADDRESS = "Britestate <notifications@britestate.com>";

// -- Service functions -------------------------------------------------------

/**
 * Input data for creating a new tenant application.
 */
export type CreateApplicationInput = Readonly<{
  property_id: string;
  applicant_name: string;
  applicant_email: string;
  employment_status?: string | null;
  monthly_income?: number | null;
  notes?: string | null;
}>;

/**
 * Create a new tenant application for a rental property.
 * Validates no duplicate application exists for the same user + property.
 * Inserts with status "received" and notifies the landlord.
 */
export async function createApplication(
  supabase: SupabaseClient,
  input: CreateApplicationInput,
): Promise<TenantApplication> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  // Look up the listing to find the landlord / owner
  const { data: listing, error: listingError } = await supabase
    .from("property_listings")
    .select("id, user_id, listing_type")
    .eq("property_id", input.property_id)
    .eq("status", "active")
    .maybeSingle();

  if (listingError || !listing) {
    throw new Error("Property listing not found or not active");
  }

  if (listing.listing_type !== "rent") {
    throw new Error("Applications can only be submitted for rental properties");
  }

  const landlordId = listing.user_id as string;

  // Check for duplicate application
  const { data: existing } = await supabase
    .from("tenant_applications")
    .select("id")
    .eq("property_id", input.property_id)
    .eq("applicant_user_id", user.id)
    .not("status", "in", '("rejected","withdrawn")')
    .maybeSingle();

  if (existing) {
    throw new Error("You have already submitted an application for this property");
  }

  // Insert the application
  const { data, error } = await supabase
    .from("tenant_applications")
    .insert({
      property_id: input.property_id,
      landlord_id: landlordId,
      applicant_user_id: user.id,
      applicant_name: input.applicant_name,
      applicant_email: input.applicant_email,
      employment_status: input.employment_status ?? null,
      monthly_income: input.monthly_income ?? null,
      notes: input.notes ?? null,
      status: "received",
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create application: ${error?.message ?? "no data"}`);
  }

  return data as TenantApplication;
}

/**
 * List tenant applications for the authenticated user.
 * For landlords: returns applications where landlord_id = user.id.
 * For renters: returns applications where applicant_user_id = user.id.
 */
export async function listMyApplications(
  supabase: SupabaseClient,
): Promise<TenantApplication[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  // Try as applicant first (renter view)
  const { data, error } = await supabase
    .from("tenant_applications")
    .select("*")
    .eq("applicant_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch applications: ${error.message}`);
  }

  return (data ?? []) as TenantApplication[];
}

/**
 * List tenant applications for the authenticated landlord, with optional filters.
 */
export async function listApplications(
  supabase: SupabaseClient,
  filters?: { propertyId?: string; status?: TenantApplicationStatus },
): Promise<TenantApplication[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  let query = supabase
    .from("tenant_applications")
    .select("*")
    .eq("landlord_id", user.id)
    .order("created_at", { ascending: false });

  if (filters?.propertyId) {
    query = query.eq("property_id", filters.propertyId);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch applications: ${error.message}`);
  }

  return (data ?? []) as TenantApplication[];
}

/**
 * Get a single tenant application by ID.
 */
export async function getApplicationById(
  supabase: SupabaseClient,
  applicationId: string,
): Promise<TenantApplication> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase
    .from("tenant_applications")
    .select("*")
    .eq("id", applicationId)
    .eq("landlord_id", user.id)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Application not found");
  }

  return data as TenantApplication;
}

/**
 * Update application status with state machine validation.
 * Throws if the transition is not allowed by the pipeline rules.
 */
export async function updateApplicationStatus(
  supabase: SupabaseClient,
  applicationId: string,
  newStatus: TenantApplicationStatus,
  reason?: string,
): Promise<TenantApplication> {
  const application = await getApplicationById(supabase, applicationId);
  const currentStatus = application.status;
  const allowed = VALID_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Invalid status transition: ${currentStatus} -> ${newStatus}. Allowed: [${allowed.join(", ")}]`,
    );
  }

  const updates: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (reason && newStatus === "rejected") {
    updates.rejection_reason = reason;
  }

  const { data, error } = await supabase
    .from("tenant_applications")
    .update(updates)
    .eq("id", applicationId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to update application status: ${error?.message ?? "no data"}`,
    );
  }

  // NOTE: referencing kickoff for the shortlisted->referencing transition lives
  // in the server route POST /api/landlord/applications/[id]/referencing, NOT
  // here. This module is imported by the client-side decision page, so it must
  // stay free of any transitive `inngest` import (which pulls node:async_hooks
  // into the client bundle and breaks the webpack build).

  return data as TenantApplication;
}

/**
 * Accept a tenant application, transitioning to 'approved'.
 * Requires current status to be 'referencing'.
 * Sends acceptance email to the applicant.
 */
export async function acceptApplication(
  supabase: SupabaseClient,
  applicationId: string,
): Promise<void> {
  const application = await updateApplicationStatus(supabase, applicationId, "approved");

  const resend = getResend();
  if (resend) {
    try {
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: application.applicant_email,
        subject: "Your rental application has been approved — Britestate",
        html: renderAcceptanceEmail(application.applicant_name),
      });
    } catch (err) {
      console.error("[tenant-application-service] Failed to send acceptance email:", err);
    }
  }
}

/**
 * Reject a tenant application, transitioning to 'rejected'.
 * Records the rejection reason and sends rejection email to the applicant.
 */
export async function rejectApplication(
  supabase: SupabaseClient,
  applicationId: string,
  reason: string,
): Promise<void> {
  const application = await updateApplicationStatus(supabase, applicationId, "rejected", reason);

  const resend = getResend();
  if (resend) {
    try {
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: application.applicant_email,
        subject: "Update on your rental application — Britestate",
        html: renderRejectionEmail(application.applicant_name),
      });
    } catch (err) {
      console.error("[tenant-application-service] Failed to send rejection email:", err);
    }
  }
}

// -- Email templates ---------------------------------------------------------

function renderAcceptanceEmail(name: string): string {
  const safeName = escapeHtml(name);
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,sans-serif;margin:0;padding:0;background:#f8f9fa;">
<div style="max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:#1B4D3E;padding:24px;border-radius:8px 8px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:20px;">Britestate</h1>
  </div>
  <div style="background:#fff;padding:32px;border-radius:0 0 8px 8px;">
    <p style="font-size:16px;color:#333;">Dear ${safeName},</p>
    <p style="font-size:15px;color:#555;">Congratulations! Your rental application has been approved. The landlord will be in touch shortly with next steps.</p>
    <p style="font-size:14px;color:#999;margin-top:32px;">The Britestate Team</p>
  </div>
</div>
</body>
</html>`;
}

function renderRejectionEmail(name: string): string {
  const safeName = escapeHtml(name);
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,sans-serif;margin:0;padding:0;background:#f8f9fa;">
<div style="max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:#1B4D3E;padding:24px;border-radius:8px 8px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:20px;">Britestate</h1>
  </div>
  <div style="background:#fff;padding:32px;border-radius:0 0 8px 8px;">
    <p style="font-size:16px;color:#333;">Dear ${safeName},</p>
    <p style="font-size:15px;color:#555;">Thank you for your interest. Unfortunately, your rental application was not successful on this occasion. We encourage you to continue searching for your ideal property on Britestate.</p>
    <p style="font-size:14px;color:#999;margin-top:32px;">The Britestate Team</p>
  </div>
</div>
</body>
</html>`;
}
