/**
 * Agent lead export service -- "Your Data, Your Leads" CSV export.
 *
 * buildLeadsCsv is pure so it can be unit-tested without a Supabase client;
 * getLeadsForExport uses the RLS-scoped session client so agents can only
 * ever export their own leads (agent_id = auth.uid()).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentLead } from "@/types/agent";

/** Column order for the exported CSV. */
export const LEADS_CSV_HEADERS = [
  "contact_name",
  "contact_email",
  "contact_phone",
  "stage",
  "source",
  "property_id",
  "notes",
  "created_at",
  "updated_at",
] as const;

/** Hard cap on exported rows (mirrors the admin audit-log export cap). */
export const LEADS_EXPORT_ROW_CAP = 10000;

/** UTF-8 byte-order mark so Excel detects the encoding correctly. */
const UTF8_BOM = "\uFEFF";

/**
 * Sanitizes a CSV cell value: always quoted, embedded quotes doubled, and
 * formula-triggering leading characters (= + - @ tab CR) prefixed with a
 * single quote to prevent Excel formula injection.
 */
function csvSafe(val: unknown): string {
  const s = String(val ?? "").replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(s)) return `"'${s}"`;
  return `"${s}"`;
}

/**
 * Builds the full CSV document (BOM + header row + one row per lead) using
 * CRLF line endings. Pure function of its input.
 */
export function buildLeadsCsv(rows: readonly AgentLead[]): string {
  const lines = [
    LEADS_CSV_HEADERS.join(","),
    ...rows.map((row) =>
      LEADS_CSV_HEADERS.map((header) => csvSafe(row[header])).join(","),
    ),
  ];
  return `${UTF8_BOM}${lines.join("\r\n")}\r\n`;
}

/**
 * Fetches every lead belonging to the given agent (oldest first), capped at
 * LEADS_EXPORT_ROW_CAP rows. The caller must pass the standard server client
 * bound to the session so RLS enforces agent_id = auth.uid().
 */
export async function getLeadsForExport(
  supabase: SupabaseClient,
  agentId: string,
): Promise<AgentLead[]> {
  const { data, error } = await supabase
    .from("agent_leads")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: true })
    .limit(LEADS_EXPORT_ROW_CAP);

  if (error) throw error;
  return (data ?? []) as AgentLead[];
}
