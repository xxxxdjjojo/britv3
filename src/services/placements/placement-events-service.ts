/**
 * placement-events-service.ts
 *
 * Server-side recording of placement analytics. Events are written with the
 * service role (createAdminClient) via the atomic `record_placement_event` RPC,
 * so impressions/clicks can't be forged by clients hitting the table directly.
 * Impressions are only ever recorded when the client beacon fires from a real,
 * visible render (see useImpressionTracking).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { computePerformance } from "@/lib/placements/transform";
import type {
  PlacementEventType,
  PlacementPerformance,
  PlacementZone,
  SponsoredPlacement,
} from "@/types/sponsored-placements";

export type RecordEventInput = {
  placementId: string;
  eventType: PlacementEventType;
  zone?: PlacementZone | null;
  propertyId?: string | null;
  viewerId?: string | null;
  sessionId?: string | null;
  metadata?: Record<string, unknown>;
};

/** Records one placement event and bumps the denormalised counter. */
export async function recordPlacementEvent(input: RecordEventInput): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.rpc("record_placement_event", {
    p_placement_id: input.placementId,
    p_event_type: input.eventType,
    p_zone: input.zone ?? null,
    p_property_id: input.propertyId ?? null,
    p_viewer_id: input.viewerId ?? null,
    p_session_id: input.sessionId ?? null,
    p_metadata: input.metadata ?? {},
  });
  if (error) throw new Error(error.message);
}

/** Performance summary for each of a provider's placements. */
export async function getProviderPerformance(
  supabase: SupabaseClient,
  providerId: string,
): Promise<PlacementPerformance[]> {
  const { data, error } = await supabase
    .from("sponsored_placements")
    .select("id, impressions_count, clicks_count, enquiries_count, monthly_price_pence")
    .eq("provider_id", providerId);
  if (error) throw new Error(error.message);

  return ((data ?? []) as Array<Pick<SponsoredPlacement, "id" | "impressions_count" | "clicks_count" | "enquiries_count" | "monthly_price_pence">>).map(
    (p) =>
      computePerformance({
        placementId: p.id,
        impressions: p.impressions_count,
        clicks: p.clicks_count,
        enquiries: p.enquiries_count,
        monthlyPricePence: p.monthly_price_pence,
      }),
  );
}
