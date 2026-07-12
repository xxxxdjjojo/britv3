/**
 * vouch-rules-service.ts
 *
 * Config + valid-vouch counting + gate evaluation for the trader vouching flow.
 *
 * - getVouchRules: reads the verification_vouch_rules singleton (resilient —
 *   never throws; falls back to hardcoded defaults).
 * - countValidVouches: counts 'verified' provider_references, split by
 *   reference_type. Client vouches additionally require a recent work_date.
 * - evaluateVouchGate: pure numeric-threshold check.
 *
 * All functions accept a SupabaseClient so they work server- or client-side.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { VouchRules } from "@/types/provider-dashboard";

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

/**
 * Hardcoded fallback for the vouching config. Mirrors the column defaults in
 * 20260712100003_vouching_rules_config.sql. Used whenever the singleton row is
 * unreadable — config must be resilient, never fail the caller.
 */
export const VOUCH_RULES_DEFAULTS: VouchRules = {
  id: true,
  required_peer_vouches: 3,
  required_client_vouches: 3,
  client_recency_days: 90,
  invite_expiry_days: 30,
  resend_cooldown_hours: 24,
  gate_enabled: false,
  updated_at: null,
  updated_by: null,
};

// ---------------------------------------------------------------------------
// getVouchRules
// ---------------------------------------------------------------------------

/**
 * Reads the verification_vouch_rules singleton row. Returns hardcoded defaults
 * on any error, missing row, or thrown exception — this function never throws.
 */
export async function getVouchRules(supabase: SupabaseClient): Promise<VouchRules> {
  try {
    const { data, error } = await supabase
      .from("verification_vouch_rules")
      .select("*")
      .eq("id", true)
      .maybeSingle();

    if (error || !data) return VOUCH_RULES_DEFAULTS;
    // Singleton invariant: the config row's id is always the literal `true`.
    // Belt-and-braces guard against a stray row leaking through.
    if ((data as { id?: unknown }).id !== true) return VOUCH_RULES_DEFAULTS;
    return data as VouchRules;
  } catch {
    return VOUCH_RULES_DEFAULTS;
  }
}

// ---------------------------------------------------------------------------
// countValidVouches
// ---------------------------------------------------------------------------

/** Milliseconds in one day — used to compute the client-recency cutoff date. */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Returns the recency cutoff as a DATE-only string (YYYY-MM-DD): the earliest
 * work_date that still counts, i.e. now - client_recency_days.
 */
function recencyCutoffDate(now: Date, recencyDays: number): string {
  const cutoff = new Date(now.getTime() - recencyDays * MS_PER_DAY);
  return cutoff.toISOString().slice(0, 10);
}

/**
 * Counts valid vouches for a provider, split by reference type.
 *
 * Only status='verified' rows count. Peer vouches have no recency requirement.
 * Client vouches additionally require work_date to be within the recency
 * window (work_date >= now - client_recency_days). Client rows with a null
 * work_date, or an older work_date, do not count.
 *
 * work_date is a DATE column; comparison is done DATE-to-DATE (string compare
 * of YYYY-MM-DD, which is lexicographically ordered).
 */
export async function countValidVouches(
  supabase: SupabaseClient,
  providerId: string,
  rules: VouchRules,
  now: Date = new Date(),
): Promise<{ peer: number; client: number }> {
  const { data, error } = await supabase
    .from("provider_references")
    .select("reference_type, work_date")
    .eq("provider_id", providerId)
    .eq("status", "verified");

  if (error || !data) return { peer: 0, client: 0 };

  const rows = data as Array<{ reference_type: string; work_date: string | null }>;
  const cutoff = recencyCutoffDate(now, rules.client_recency_days);

  let peer = 0;
  let client = 0;
  for (const row of rows) {
    if (row.reference_type === "peer") {
      peer += 1;
    } else if (row.reference_type === "client") {
      // Normalise to DATE-only (work_date is a DATE; guard timestamp inputs).
      const workDate = row.work_date ? row.work_date.slice(0, 10) : null;
      if (workDate && workDate >= cutoff) client += 1;
    }
  }

  return { peer, client };
}

// ---------------------------------------------------------------------------
// evaluateVouchGate (pure)
// ---------------------------------------------------------------------------

/**
 * Pure numeric-threshold evaluation. `allMet` reflects only the vouch-count
 * requirement — it does NOT imply auto-approval, which stays an admin decision.
 */
export function evaluateVouchGate(
  counts: { peer: number; client: number },
  rules: VouchRules,
): { peerMet: boolean; clientMet: boolean; allMet: boolean; gateEnabled: boolean } {
  const peerMet = counts.peer >= rules.required_peer_vouches;
  const clientMet = counts.client >= rules.required_client_vouches;
  return {
    peerMet,
    clientMet,
    allMet: peerMet && clientMet,
    gateEnabled: rules.gate_enabled,
  };
}
