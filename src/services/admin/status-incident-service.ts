import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

/**
 * Status-incident domain (PR 3). Pure transition/classification helpers are
 * unit-tested; the data-access helpers back the public /status page (read of
 * published rows, resilient) and the audited admin routes (writes via the
 * service-role client passed in from auditedAdminActionWithPermission).
 */

export type IncidentSeverity = "minor" | "major" | "critical" | "maintenance";
export type IncidentStatus =
  | "investigating"
  | "identified"
  | "monitoring"
  | "resolved"
  | "scheduled";

export const INCIDENT_SEVERITIES: readonly IncidentSeverity[] = [
  "minor",
  "major",
  "critical",
  "maintenance",
];
export const INCIDENT_STATUSES: readonly IncidentStatus[] = [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
  "scheduled",
];

/** How many days a resolved incident stays visible in the public history. */
export const RESOLVED_HISTORY_DAYS = 7;

export type StatusIncident = Readonly<{
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affectedComponents: readonly string[];
  startedAt: string;
  resolvedAt: string | null;
  scheduledFor: string | null;
  scheduledUntil: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}>;

export type IncidentUpdate = Readonly<{
  id: string;
  incidentId: string;
  status: string;
  body: string;
  createdAt: string;
}>;

export type IncidentBucket = "active" | "scheduled" | "resolved";

export type PublicIncidents = Readonly<{
  active: readonly StatusIncident[];
  scheduled: readonly StatusIncident[];
  recentResolved: readonly StatusIncident[];
}>;

// ---- Pure helpers (unit-tested) -------------------------------------------

/** Which public bucket an incident belongs in. */
export function classifyIncident(incident: Pick<StatusIncident, "status">): IncidentBucket {
  if (incident.status === "resolved") return "resolved";
  if (incident.status === "scheduled") return "scheduled";
  return "active";
}

const ALLOWED_NEXT: Record<IncidentStatus, readonly IncidentStatus[]> = {
  scheduled: ["investigating", "monitoring", "resolved"],
  investigating: ["identified", "monitoring", "resolved"],
  identified: ["monitoring", "resolved"],
  monitoring: ["resolved", "investigating"],
  resolved: [],
};

/** Guard the incident lifecycle: no jumping back out of resolved, etc. */
export function isValidStatusTransition(from: IncidentStatus, to: IncidentStatus): boolean {
  if (from === to) return true;
  return ALLOWED_NEXT[from].includes(to);
}

// ---- Data access ----------------------------------------------------------

type IncidentRow = {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affected_components: string[] | null;
  started_at: string;
  resolved_at: string | null;
  scheduled_for: string | null;
  scheduled_until: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

function mapRow(row: IncidentRow): StatusIncident {
  return {
    id: row.id,
    title: row.title,
    severity: row.severity,
    status: row.status,
    affectedComponents: row.affected_components ?? [],
    startedAt: row.started_at,
    resolvedAt: row.resolved_at,
    scheduledFor: row.scheduled_for,
    scheduledUntil: row.scheduled_until,
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_COLS =
  "id, title, severity, status, affected_components, started_at, resolved_at, scheduled_for, scheduled_until, is_published, created_at, updated_at";

/**
 * Published incidents for the public /status page, split into buckets.
 * Resilient by design: a query failure (e.g. table not yet migrated on this
 * environment) returns empty buckets rather than crashing the status page.
 */
export async function getPublicIncidents(): Promise<PublicIncidents> {
  try {
    const supabase = await createClient();
    const resolvedCutoff = new Date(
      Date.now() - RESOLVED_HISTORY_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data, error } = await supabase
      .from("status_incidents")
      .select(SELECT_COLS)
      .eq("is_published", true)
      .order("started_at", { ascending: false });

    if (error || !data) return { active: [], scheduled: [], recentResolved: [] };

    const incidents = (data as IncidentRow[]).map(mapRow);
    return {
      active: incidents.filter((i) => classifyIncident(i) === "active"),
      scheduled: incidents.filter((i) => classifyIncident(i) === "scheduled"),
      recentResolved: incidents.filter(
        (i) => classifyIncident(i) === "resolved" && (i.resolvedAt ?? "") >= resolvedCutoff,
      ),
    };
  } catch {
    return { active: [], scheduled: [], recentResolved: [] };
  }
}

/** Every incident (published or draft) for the admin queue. */
export async function listAllIncidents(
  supabase: SupabaseClient,
): Promise<StatusIncident[]> {
  const { data, error } = await supabase
    .from("status_incidents")
    .select(SELECT_COLS)
    .order("started_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data as IncidentRow[]).map(mapRow);
}

export type CreateIncidentInput = Readonly<{
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affectedComponents?: readonly string[];
  scheduledFor?: string | null;
  scheduledUntil?: string | null;
  isPublished?: boolean;
}>;

export async function createIncident(
  supabase: SupabaseClient,
  input: CreateIncidentInput,
  createdBy: string,
): Promise<{ id: string }> {
  if (!input.title?.trim()) throw new Error("Title is required");
  if (!INCIDENT_SEVERITIES.includes(input.severity)) throw new Error("Invalid severity");
  if (!INCIDENT_STATUSES.includes(input.status)) throw new Error("Invalid status");

  const { data, error } = await supabase
    .from("status_incidents")
    .insert({
      title: input.title.trim(),
      severity: input.severity,
      status: input.status,
      affected_components: input.affectedComponents ?? [],
      scheduled_for: input.scheduledFor ?? null,
      scheduled_until: input.scheduledUntil ?? null,
      is_published: input.isPublished ?? false,
      created_by: createdBy,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id as string };
}

export type UpdateIncidentPatch = Readonly<{
  status?: IncidentStatus;
  isPublished?: boolean;
  affectedComponents?: readonly string[];
  updateBody?: string;
}>;

/**
 * Apply an admin patch: optional status transition (validated), publish toggle,
 * component change, and/or a public update-timeline entry. Sets resolved_at
 * when moving to resolved.
 */
export async function updateIncident(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateIncidentPatch,
  actorId: string,
): Promise<void> {
  const { data: current, error: readError } = await supabase
    .from("status_incidents")
    .select("status")
    .eq("id", id)
    .single();
  if (readError || !current) throw new Error(readError?.message ?? "Incident not found");

  const fields: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (patch.status && patch.status !== current.status) {
    if (!isValidStatusTransition(current.status as IncidentStatus, patch.status)) {
      throw new Error(`Invalid status transition: ${current.status} → ${patch.status}`);
    }
    fields.status = patch.status;
    if (patch.status === "resolved") fields.resolved_at = new Date().toISOString();
  }
  if (patch.isPublished !== undefined) fields.is_published = patch.isPublished;
  if (patch.affectedComponents) fields.affected_components = patch.affectedComponents;

  const { error: updateError } = await supabase
    .from("status_incidents")
    .update(fields)
    .eq("id", id);
  if (updateError) throw new Error(updateError.message);

  if (patch.updateBody?.trim()) {
    const { error: noteError } = await supabase.from("status_incident_updates").insert({
      incident_id: id,
      status: patch.status ?? (current.status as IncidentStatus),
      body: patch.updateBody.trim(),
      created_by: actorId,
    });
    if (noteError) throw new Error(noteError.message);
  }
}
