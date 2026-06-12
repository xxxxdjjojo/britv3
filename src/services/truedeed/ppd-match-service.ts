/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * Truedeed PPD match service (Phase 3, spec §4.2–§4.4 — `ppd:match` job).
 *
 * `processMatchesForPpdRows` scores ingested PPD transactions against
 * listings (with embedded introductions and their reported outcomes) found
 * by normalised postcode. Scoring is delegated to the pure
 * `@/lib/truedeed/ppd-matcher`, and every branch decision reads that
 * module's exported threshold constants — never hardcoded numbers.
 *
 *  - Verification mode (a 'completed' reported outcome exists):
 *      score >= VERIFICATION_AUTO_CONFIRM → status 'confirmed'
 *      below                              → status 'pending_review'
 *  - Audit mode (no completed outcome — §4.4: a query, NEVER an invoice):
 *      score >= AUDIT_QUERY     → status 'branch_queried', plus an on-hold
 *        invoice candidate (hold_expires_at = 10 business days, clause
 *        10.2) and a 'truedeed/audit-query.raised' event for the email job
 *      [WATCHLIST, AUDIT_QUERY) → ops watchlist 'pending_review' only
 *      below WATCHLIST          → nothing
 *
 * Duplicate ppd_tuid+listing_id matches (23505) are skipped silently;
 * per-row errors skip the row without aborting the batch. Never throws.
 *
 * SECURITY NOTE: Logs carry only error_type (the Error constructor name)
 * and entity ids — never addresses, applicant names or other PII.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { inngest } from "@/inngest/client";
import {
  scoreMatch,
  normalisePostcode,
  VERIFICATION_AUTO_CONFIRM,
  AUDIT_QUERY,
  WATCHLIST,
} from "@/lib/truedeed/ppd-matcher";
import {
  addBusinessDays,
  getEnglandWalesBankHolidays,
} from "@/lib/business-days";
import type { ParsedPpdRow } from "@/lib/truedeed/ppd-parser";

/** Clause 10.2: branch queries hold the invoice for 10 business days. */
const HOLD_BUSINESS_DAYS = 10;

/** Postgres unique-violation SQLSTATE (ppd_tuid+listing_id already matched). */
const UNIQUE_VIOLATION = "23505";

const LISTING_SELECT =
  "id, postcode, paon, saon, street, property_type, asking_price_pence, " +
  "introductions ( id, occurred_at, tail_expires_at, status, " +
  "reported_outcomes ( id, outcome ) )";

export type PpdMatchCounts = {
  /** ppd_match_candidates rows inserted. */
  created: number;
  /** Audit-mode branch queries raised (status 'branch_queried'). */
  queried: number;
};

type IntroductionRow = {
  id: string;
  occurred_at: string;
  tail_expires_at: string;
  status: string;
  reported_outcomes?: Array<{ id: string; outcome: string }> | null;
};

type ListingRow = {
  id: string;
  postcode: string | null;
  paon: string | null;
  saon: string | null;
  street: string | null;
  property_type: string | null;
  asking_price_pence: number | null;
  introductions?: IntroductionRow[] | null;
};

function errorType(error: unknown): string {
  return error instanceof Error ? error.constructor.name : "UnknownError";
}

/**
 * Scores each PPD row against the listings sharing its normalised postcode
 * and writes the resulting match candidates (plus, for audit-mode branch
 * queries, the on-hold invoice candidate and the clause-10.2 event).
 * Rows without a postcode are skipped outright; per-row failures skip the
 * row. Returns the batch counts, or null on top-level failure. Never throws.
 */
export async function processMatchesForPpdRows(
  rows: ParsedPpdRow[],
): Promise<PpdMatchCounts | null> {
  try {
    const supabase = createAdminClient();
    let created = 0;
    let queried = 0;
    let holidays: string[] | null = null;

    for (const row of rows) {
      if (!row.postcode) continue;

      try {
        const { data: listings, error: listingsError } = await supabase
          .from("listings")
          .select(LISTING_SELECT)
          .eq("postcode", normalisePostcode(row.postcode));
        if (listingsError || !Array.isArray(listings)) {
          console.error("[truedeed] ppd match listings query failed", {
            ppd_tuid: row.tuid,
          });
          continue;
        }

        for (const listing of listings as unknown as ListingRow[]) {
          for (const intro of listing.introductions ?? []) {
            const match = scoreMatch(
              {
                ppdTuid: row.tuid,
                pricePence: row.pricePence,
                transferDate: row.transferDate,
                postcode: row.postcode,
                propertyType: row.propertyType,
                paon: row.paon,
                saon: row.saon,
                street: row.street,
                ppdCategory: row.ppdCategory,
              },
              {
                listingId: listing.id,
                postcode: listing.postcode,
                paon: listing.paon,
                saon: listing.saon,
                street: listing.street,
                propertyType: listing.property_type,
                askingPricePence: listing.asking_price_pence,
                introduction: {
                  introductionId: intro.id,
                  occurredAt: intro.occurred_at,
                  tailExpiresAt: intro.tail_expires_at,
                },
              },
            );
            if (!match) continue;

            // Mode: a 'completed' reported outcome puts us in verification
            // mode (checking the agent's report); otherwise audit mode
            // (§4.4 — an unreported completion raises a query, never an
            // invoice directly).
            const isVerification = (intro.reported_outcomes ?? []).some(
              (outcome) => outcome.outcome === "completed",
            );

            let mode: "verification" | "audit";
            let status: "confirmed" | "branch_queried" | "pending_review";
            if (isVerification) {
              mode = "verification";
              status =
                match.score >= VERIFICATION_AUTO_CONFIRM
                  ? "confirmed"
                  : "pending_review";
            } else if (match.score >= AUDIT_QUERY) {
              mode = "audit";
              status = "branch_queried";
            } else if (match.score >= WATCHLIST) {
              mode = "audit";
              status = "pending_review";
            } else {
              continue;
            }

            const { data: candidate, error: insertError } = await supabase
              .from("ppd_match_candidates")
              .insert({
                ppd_tuid: row.tuid,
                listing_id: listing.id,
                introduction_id: intro.id,
                mode,
                status,
                score: match.score,
                score_components: match.components,
              })
              .select("id")
              .single();
            if (insertError || !candidate) {
              const code = (insertError as { code?: string } | null)?.code;
              if (code !== UNIQUE_VIOLATION) {
                console.error("[truedeed] ppd match candidate insert failed", {
                  ppd_tuid: row.tuid,
                  listing_id: listing.id,
                });
              }
              continue; // duplicate or per-row failure: counted in neither
            }
            const matchId = candidate.id as string;
            created += 1;

            if (status === "branch_queried") {
              holidays = holidays ?? (await getEnglandWalesBankHolidays());
              const holdExpiresAt = addBusinessDays(
                new Date(),
                HOLD_BUSINESS_DAYS,
                holidays,
              ).toISOString();

              const { error: invoiceError } = await supabase
                .from("invoice_candidates")
                .insert({
                  source: "audit_match",
                  introduction_id: intro.id,
                  ppd_match_id: matchId,
                  status: "on_hold_branch_query",
                  hold_expires_at: holdExpiresAt,
                });
              if (invoiceError) {
                console.error(
                  "[truedeed] ppd match invoice candidate insert failed",
                  { ppd_match_id: matchId },
                );
              } else {
                await inngest.send({
                  name: "truedeed/audit-query.raised",
                  data: {
                    matchId,
                    introductionId: intro.id,
                    listingId: listing.id,
                  },
                });
              }
              queried += 1;
            }
          }
        }
      } catch (rowError: unknown) {
        console.error("[truedeed] ppd match row failed", {
          error_type: errorType(rowError),
          ppd_tuid: row.tuid,
        });
      }
    }

    return { created, queried };
  } catch (error: unknown) {
    console.error("[truedeed] processMatchesForPpdRows failed", {
      error_type: errorType(error),
    });
    return null;
  }
}
