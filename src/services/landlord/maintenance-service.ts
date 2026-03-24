/**
 * Maintenance service -- CRUD operations for maintenance requests,
 * photo uploads with compression/validation, and status state machine.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MaintenanceRequest,
  MaintenanceStatus,
  MaintenancePriority,
} from "@/types/landlord";
import { maintenanceRequestSchema } from "@/types/landlord";
import { validateFileType } from "@/lib/file-validation";
import { compressImage } from "@/lib/image-compression";

// -- State machine ------------------------------------------------------------

const ALLOWED_TRANSITIONS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  new: ["acknowledged"],
  acknowledged: ["assigned", "in_progress"],
  assigned: ["in_progress"],
  in_progress: ["resolved"],
  resolved: ["closed"],
  closed: [],
};

export function canTransitionTo(
  from: MaintenanceStatus,
  to: MaintenanceStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidNextStatuses(
  current: MaintenanceStatus,
): MaintenanceStatus[] {
  return ALLOWED_TRANSITIONS[current] ?? [];
}

// -- Filters type -------------------------------------------------------------

type MaintenanceFilters = Readonly<{
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
}>;

// -- Service functions --------------------------------------------------------

/**
 * List maintenance requests for a property, with optional status/priority filters.
 * Ordered by created_at DESC (newest first).
 */
export async function getMaintenanceRequests(
  supabase: SupabaseClient,
  propertyId: string,
  filters?: MaintenanceFilters,
): Promise<MaintenanceRequest[]> {
  let query = supabase
    .from("maintenance_requests")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.priority) {
    query = query.eq("priority", filters.priority);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch maintenance requests: ${error.message}`);
  }

  return (data ?? []) as MaintenanceRequest[];
}

/**
 * Extended row type that includes property address and active tenant name,
 * fetched via join for the portfolio-wide inbox.
 */
export type MaintenanceRequestWithProperty = MaintenanceRequest &
  Readonly<{
    property_address: string;
    property_postcode: string;
    tenant_name: string | null;
  }>;

/**
 * Portfolio-wide maintenance inbox — returns all requests across all properties
 * owned by the current authenticated user (via RLS), sorted by priority then
 * created_at (emergency first).
 *
 * The join to properties gives us the address; the join to tenancies gives us
 * the active tenant name.
 */
export async function getPortfolioMaintenanceRequests(
  supabase: SupabaseClient,
  filters?: MaintenanceFilters,
): Promise<MaintenanceRequestWithProperty[]> {
  let query = supabase
    .from("maintenance_requests")
    .select(
      `
      *,
      properties!inner(address_line1, postcode),
      tenancies(tenant_name, status)
    `,
    )
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.priority) {
    query = query.eq("priority", filters.priority);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`[maintenance-service] Failed to fetch portfolio maintenance requests: ${error.message}`);
    return [];
  }

  return ((data ?? []) as unknown[]).map((row: unknown) => {
    const r = row as Record<string, unknown>;
    const prop = r.properties as Record<string, unknown> | null;
    const tenancies = r.tenancies as Array<Record<string, unknown>> | null;
    const activeTenancy = tenancies?.find((t) => t.status === "active");

    return {
      ...(r as MaintenanceRequest),
      property_address: prop
        ? String(prop.address_line1)
        : "Unknown address",
      property_postcode: prop ? String(prop.postcode) : "",
      tenant_name: activeTenancy
        ? String(activeTenancy.tenant_name)
        : null,
    } as MaintenanceRequestWithProperty;
  });
}

/**
 * Get a single maintenance request by ID, including the property address
 * and active tenant name.
 */
export async function getMaintenanceRequestById(
  supabase: SupabaseClient,
  requestId: string,
): Promise<MaintenanceRequestWithProperty> {
  const { data, error } = await supabase
    .from("maintenance_requests")
    .select(
      `
      *,
      properties!inner(address_line1, postcode),
      tenancies(tenant_name, tenant_email, tenant_phone, status)
    `,
    )
    .eq("id", requestId)
    .single();

  if (error || !data) {
    throw new Error(
      `Maintenance request not found: ${error?.message ?? "no data"}`,
    );
  }

  const r = data as unknown as Record<string, unknown>;
  const prop = r.properties as Record<string, unknown> | null;
  const tenancies = r.tenancies as Array<Record<string, unknown>> | null;
  const activeTenancy = tenancies?.find((t) => t.status === "active");

  return {
    ...(r as unknown as MaintenanceRequest),
    property_address: prop ? String(prop.address_line1) : "Unknown address",
    property_postcode: prop ? String(prop.postcode) : "",
    tenant_name: activeTenancy ? String(activeTenancy.tenant_name) : null,
  } as MaintenanceRequestWithProperty;
}

/**
 * Get a single maintenance request by ID.
 */
export async function getMaintenanceRequest(
  supabase: SupabaseClient,
  requestId: string,
): Promise<MaintenanceRequest> {
  const { data, error } = await supabase
    .from("maintenance_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (error || !data) {
    throw new Error(
      `Maintenance request not found: ${error?.message ?? "no data"}`,
    );
  }

  return data as MaintenanceRequest;
}

/**
 * Create a new maintenance request.
 * Validates input with Zod schema. Photos are uploaded separately via
 * uploadMaintenancePhoto after the record is created.
 */
export async function createMaintenanceRequest(
  supabase: SupabaseClient,
  propertyId: string,
  data: {
    title: string;
    description: string;
    priority?: string;
    reported_by: string;
    tenancy_id?: string | null;
  },
): Promise<MaintenanceRequest> {
  const parsed = maintenanceRequestSchema.parse({
    title: data.title,
    description: data.description,
    priority: data.priority ?? "medium",
  });

  const { data: record, error } = await supabase
    .from("maintenance_requests")
    .insert({
      property_id: propertyId,
      title: parsed.title,
      description: parsed.description,
      priority: parsed.priority,
      status: "new" as MaintenanceStatus,
      reported_by: data.reported_by,
      tenancy_id: data.tenancy_id ?? null,
      photo_urls: [],
    })
    .select()
    .single();

  if (error || !record) {
    throw new Error(
      `Failed to create maintenance request: ${error?.message ?? "no data"}`,
    );
  }

  return record as MaintenanceRequest;
}

/**
 * Update a maintenance request -- handles status transitions, provider
 * assignment, and resolution.
 *
 * Status transitions are validated against the state machine. When resolving,
 * resolution_notes are required and resolved_at is set automatically.
 * When assigning a provider, status is set to 'assigned' automatically.
 */
export async function updateMaintenanceRequest(
  supabase: SupabaseClient,
  requestId: string,
  data: {
    status?: MaintenanceStatus;
    assigned_provider_id?: string;
    assigned_provider_name?: string;
    resolution_notes?: string;
  },
): Promise<MaintenanceRequest> {
  // Fetch current state
  const current = await getMaintenanceRequest(supabase, requestId);

  // Build update payload
  const updates: Record<string, unknown> = {};

  // Handle provider assignment
  if (data.assigned_provider_id) {
    updates.assigned_provider_id = data.assigned_provider_id;
    updates.assigned_provider_name = data.assigned_provider_name ?? null;

    // Auto-transition to 'assigned' if currently in acknowledged state
    if (!data.status && canTransitionTo(current.status, "assigned")) {
      updates.status = "assigned";
    }
  }

  // Handle status transition
  if (data.status && data.status !== current.status) {
    if (!canTransitionTo(current.status, data.status)) {
      throw new Error(
        `Invalid status transition: ${current.status} -> ${data.status}. ` +
          `Valid transitions: ${getValidNextStatuses(current.status).join(", ") || "none"}`,
      );
    }

    // Require resolution_notes when resolving
    if (data.status === "resolved" && !data.resolution_notes) {
      throw new Error("Resolution notes are required when resolving a request");
    }

    updates.status = data.status;

    if (data.status === "resolved") {
      updates.resolution_notes = data.resolution_notes;
      updates.resolved_at = new Date().toISOString();
    }
  }

  if (Object.keys(updates).length === 0) {
    return current;
  }

  const { data: updated, error } = await supabase
    .from("maintenance_requests")
    .update(updates)
    .eq("id", requestId)
    .select()
    .single();

  if (error || !updated) {
    throw new Error(
      `Failed to update maintenance request: ${error?.message ?? "no data"}`,
    );
  }

  return updated as MaintenanceRequest;
}

/**
 * Upload a photo for a maintenance request.
 * Compresses the image, validates file type (JPEG/PNG only),
 * uploads to Supabase Storage, and appends the URL to photo_urls.
 * Maximum 3 photos per request.
 */
export async function uploadMaintenancePhoto(
  supabase: SupabaseClient,
  propertyId: string,
  requestId: string,
  file: File,
): Promise<string> {
  // Check current photo count
  const current = await getMaintenanceRequest(supabase, requestId);
  if (current.photo_urls.length >= 3) {
    throw new Error("Maximum 3 photos per maintenance request");
  }

  // Validate file type (only images, not PDF)
  const validation = await validateFileType(file);
  if (!validation.valid || !validation.mimeType?.startsWith("image/")) {
    throw new Error("Only JPEG and PNG images are allowed");
  }

  // Compress image
  const compressed = await compressImage(file, { maxSizeMB: 0.5 });

  // Upload to storage
  const filePath = `${propertyId}/${requestId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("maintenance-photos")
    .upload(filePath, compressed, {
      contentType: validation.mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload photo: ${uploadError.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("maintenance-photos").getPublicUrl(filePath);

  // Append URL to photo_urls array
  const { error: updateError } = await supabase
    .from("maintenance_requests")
    .update({
      photo_urls: [...current.photo_urls, publicUrl],
    })
    .eq("id", requestId);

  if (updateError) {
    throw new Error(`Failed to update photo URLs: ${updateError.message}`);
  }

  return publicUrl;
}
