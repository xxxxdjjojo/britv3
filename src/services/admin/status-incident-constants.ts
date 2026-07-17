/**
 * Status-incident domain constants and types (PR 3).
 *
 * Split out from `status-incident-service.ts` because that module imports the
 * Supabase server client (`next/headers`), which cannot be pulled into a Client
 * Component bundle. The admin control surface (`StatusIncidentsClient`) needs
 * the severity/status option arrays at runtime, so they live here — a
 * server-safe *and* client-safe module with no server-only imports. The service
 * re-exports everything below, so existing server-side imports are unaffected.
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
