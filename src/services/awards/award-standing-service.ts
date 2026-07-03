import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getUserOrganisation } from "@/services/organisations/organisation-service";
import {
  buildAgencyAwardStanding,
  type AgencyAwardStanding,
  type AwardScoreRow,
} from "./award-scoring-service";

/**
 * Honest Agent Awards — agency standing reads for the agent dashboard and
 * the /awards opt-in CTA. Pure shaping lives in award-scoring-service; this
 * module is the only place that touches agent_award_scores /
 * agent_award_nominations with a user-context client (RLS lets members read
 * their own agency's rows, including suppressed ones, so the panel can
 * explain exclusions honestly).
 */

/** Awards run on calendar years: '2026'. */
export function currentAwardPeriod(now: Date = new Date()): string {
  return String(now.getUTCFullYear());
}

export type AgencyAwardStandingResult = {
  /** Null when the user has no active estate-agency organisation. */
  organisation: { id: string; name: string } | null;
  /** True when the agency has a live (non-withdrawn) opt-in for the period. */
  optedIn: boolean;
  period: string;
  /** Null when the user has no organisation; otherwise always shaped. */
  standing: AgencyAwardStanding | null;
};

/**
 * Resolves the caller's agency and returns its award standing: opt-in status
 * plus per-metric scores or the honest exclusion explanation. Never throws —
 * returns the empty shape on any error so the dashboard degrades gracefully.
 */
export async function getAgencyAwardStanding(
  supabase: SupabaseClient,
  userId: string,
): Promise<AgencyAwardStandingResult> {
  const period = currentAwardPeriod();
  const empty: AgencyAwardStandingResult = {
    organisation: null,
    optedIn: false,
    period,
    standing: null,
  };

  try {
    const organisation = await getUserOrganisation(supabase, userId);
    if (!organisation) return empty;

    const [nominationRes, scoresRes] = await Promise.all([
      supabase
        .from("agent_award_nominations")
        .select("id")
        .eq("agency_id", organisation.organisation_id)
        .eq("period", period)
        .is("withdrawn_at", null)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("agent_award_scores")
        .select("agency_id, period, metric, value, sample_n, eligibility_flag, computed_at")
        .eq("agency_id", organisation.organisation_id),
    ]);

    const rows = (scoresRes.error ? [] : (scoresRes.data ?? [])) as unknown as AwardScoreRow[];

    return {
      organisation: { id: organisation.organisation_id, name: organisation.name },
      optedIn: !nominationRes.error && nominationRes.data !== null,
      period,
      standing: buildAgencyAwardStanding(rows),
    };
  } catch {
    return empty;
  }
}
