/**
 * Truedeed suspension listing-visibility filter (billing spec §5
 * `billing:suspend`: "listings are hidden — single flag the listing query
 * respects").
 *
 * The public search reads the `search_listings` materialized view (and its
 * radius/polygon RPC twins), none of which carry an owner column — so the
 * suspension flag cannot be joined inside the query without a migration that
 * the billing workstream does not own. Instead this helper post-filters a
 * page of search results against `agent_agency_profiles.billing_suspended_at`.
 *
 * Applied in ONE place: the main public search path
 * (src/services/search/search-service.ts → searchProperties, which feeds
 * /properties). Other read paths intentionally NOT covered here (each either
 * needs its own product decision or is not applicant-facing search):
 *   - src/services/properties/property-detail-service.ts (direct detail view)
 *   - src/services/ai/ai-match-service.ts (AI matching)
 *   - sitemap/SEO listing enumerations
 * When the view gains an owner column, fold this into the query and delete
 * this helper.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/observability/capture-exception";

type ListingIdRow = { listing_id: string };

/**
 * Remove listings owned by billing-suspended agents from a search page.
 *
 * Fast path: one indexed query for suspended agents — when none exist (the
 * normal case) the page is returned untouched. Fails open on query errors:
 * search availability beats suspension enforcement.
 */
export async function excludeBillingSuspendedListings<T extends ListingIdRow>(
  listings: readonly T[],
): Promise<T[]> {
  if (listings.length === 0) return [...listings];

  try {
    const admin = createAdminClient();

    const { data: suspended, error: suspendedError } = await admin
      .from("agent_agency_profiles")
      .select("agent_id")
      .not("billing_suspended_at", "is", null);

    if (suspendedError) throw new Error(suspendedError.message);
    const suspendedIds = (suspended ?? []).map(
      (row) => (row as { agent_id: string }).agent_id,
    );
    if (suspendedIds.length === 0) return [...listings];

    const { data: owned, error: ownedError } = await admin
      .from("listings")
      .select("id")
      .in("id", listings.map((l) => l.listing_id))
      .in("user_id", suspendedIds);

    if (ownedError) throw new Error(ownedError.message);
    const hidden = new Set(
      (owned ?? []).map((row) => (row as { id: string }).id),
    );
    if (hidden.size === 0) return [...listings];

    return listings.filter((l) => !hidden.has(l.listing_id));
  } catch (err) {
    captureException(err, {
      module: "truedeed",
      feature: "listing-visibility",
      operation: "excludeBillingSuspendedListings",
    });
    return [...listings];
  }
}
