/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminListing = {
  id: string;
  title: string | null;
  /** Moderation status: pending | approved | rejected (from listing_moderation). */
  status: string | null;
  created_at: string | null;
  user_id: string | null;
  flagged: boolean;
};

type ModerationRow = { status: string | null; flags: unknown[] | null; reviewed_at: string | null };

type ListingRow = {
  id: string;
  created_at: string | null;
  user_id: string | null;
  properties: { title: string | null } | { title: string | null }[] | null;
  listing_moderation: ModerationRow[] | null;
};

function listingTitle(row: ListingRow): string | null {
  const prop = Array.isArray(row.properties) ? row.properties[0] : row.properties;
  return prop?.title ?? null;
}

/** Effective moderation state = the most recent listing_moderation row. */
function latestModeration(row: ListingRow): ModerationRow | null {
  const rows = row.listing_moderation ?? [];
  if (rows.length === 0) return null;
  return [...rows].sort((a, b) =>
    String(b.reviewed_at ?? "").localeCompare(String(a.reviewed_at ?? "")),
  )[0];
}

function isFlagged(mod: ModerationRow | null): boolean {
  if (!mod || !Array.isArray(mod.flags)) return false;
  return mod.flags.some(
    (f) => typeof f === "object" && f !== null && (f as { type?: string }).type === "flag",
  );
}

export async function getListingQueue(
  supabase: SupabaseClient,
  statusFilter?: string,
  page = 0,
  limit = 50,
): Promise<{ listings: AdminListing[]; total: number }> {
  const from = page * limit;
  const to = from + limit - 1;

  // The property title is on the related `properties` row; moderation state
  // (pending|approved|rejected + flags) lives in listing_moderation. Neither
  // `properties` nor `listings` carries a moderation status/title-on-listing.
  const { data, error, count } = await supabase
    .from("listings")
    .select(
      "id, created_at, user_id, properties(title), listing_moderation(status, flags, reviewed_at)",
      { count: "exact" },
    )
    .order("created_at", { ascending: true })
    .range(from, to);

  if (error) {
    console.error("[admin:listing-service] getListingQueue failed", { error: error.message });
    return { listings: [], total: 0 };
  }

  const rows = (data as ListingRow[]) ?? [];
  let listings: AdminListing[] = rows.map((row) => {
    const mod = latestModeration(row);
    return {
      id: row.id,
      title: listingTitle(row),
      status: mod?.status ?? "pending",
      created_at: row.created_at,
      user_id: row.user_id,
      flagged: isFlagged(mod),
    };
  });

  // The moderation tabs filter on moderation state, not the listings enum.
  if (statusFilter === "flagged") {
    listings = listings.filter((l) => l.flagged);
  } else if (statusFilter) {
    listings = listings.filter((l) => l.status === statusFilter);
  }

  return { listings, total: statusFilter ? listings.length : count ?? 0 };
}

/**
 * Record a moderation decision in `listing_moderation`. The listings.status
 * enum has no 'rejected'/'flagged' values, and properties has no status column,
 * so moderation outcomes are written to the dedicated listing_moderation table
 * (status pending|approved|rejected; reasons stored in the `flags` jsonb).
 */
async function recordModeration(
  supabase: SupabaseClient,
  listingId: string,
  status: "approved" | "rejected" | "pending",
  flags: unknown[] = [],
): Promise<{ success: boolean }> {
  const { error } = await supabase.from("listing_moderation").insert({
    listing_id: listingId,
    status,
    flags,
    reviewed_at: new Date().toISOString(),
  });
  return { success: !error };
}

export async function approveListing(
  supabase: SupabaseClient,
  listingId: string,
): Promise<{ success: boolean }> {
  return recordModeration(supabase, listingId, "approved");
}

export async function rejectListing(
  supabase: SupabaseClient,
  listingId: string,
  reason?: string,
): Promise<{ success: boolean }> {
  return recordModeration(
    supabase,
    listingId,
    "rejected",
    reason ? [{ type: "rejection", reason }] : [],
  );
}

export async function flagListing(
  supabase: SupabaseClient,
  listingId: string,
  reason?: string,
): Promise<{ success: boolean }> {
  // No 'flagged' status exists; a flag keeps the listing pending review with the
  // flag captured in the `flags` jsonb.
  return recordModeration(
    supabase,
    listingId,
    "pending",
    reason ? [{ type: "flag", reason }] : [{ type: "flag" }],
  );
}
