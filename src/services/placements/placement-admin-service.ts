/**
 * placement-admin-service.ts
 *
 * Admin operations over the advertising marketplace: moderate placements
 * (approve/reject/pause/feature/override), report revenue & slot usage, and
 * manage the pricing catalogue. Callers pass an admin-authenticated Supabase
 * client (the admin RLS policy grants full access).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { PlacementProduct, SponsoredPlacement } from "@/types/sponsored-placements";

export type AdminPlacementRow = SponsoredPlacement & {
  service_provider_details: { business_name: string; slug: string } | null;
};

export async function listAllPlacements(
  supabase: SupabaseClient,
  filter?: { status?: SponsoredPlacement["status"] },
): Promise<AdminPlacementRow[]> {
  let q = supabase
    .from("sponsored_placements")
    .select("*, service_provider_details(business_name, slug)")
    .order("created_at", { ascending: false });
  if (filter?.status) q = q.eq("status", filter.status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminPlacementRow[];
}

export type ReviewAction =
  | { type: "approve" }
  | { type: "reject"; reason: string }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "feature"; featured: boolean }
  | { type: "override"; priority: number | null };

/** Build the column patch for a moderation action (pure, testable). */
export function reviewPatch(action: ReviewAction): Partial<SponsoredPlacement> {
  switch (action.type) {
    case "approve":
      return { status: "active", rejection_reason: null };
    case "reject":
      return { status: "rejected", rejection_reason: action.reason };
    case "pause":
      return { status: "paused" };
    case "resume":
      return { status: "active" };
    case "feature":
      return { admin_featured: action.featured };
    case "override":
      return { priority_override: action.priority };
  }
}

export async function reviewPlacement(
  supabase: SupabaseClient,
  placementId: string,
  action: ReviewAction,
): Promise<void> {
  const { error } = await supabase
    .from("sponsored_placements")
    .update(reviewPatch(action))
    .eq("id", placementId);
  if (error) throw new Error(error.message);
}

/** Monthly recurring revenue (pence) from all active placements. */
export async function getActiveRevenuePence(supabase: SupabaseClient): Promise<number> {
  const { data, error } = await supabase
    .from("sponsored_placements")
    .select("monthly_price_pence")
    .eq("status", "active");
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<{ monthly_price_pence: number }>).reduce((sum, r) => sum + (r.monthly_price_pence ?? 0), 0);
}

// ---------------------------------------------------------------------------
// Pricing catalogue CRUD
// ---------------------------------------------------------------------------

export async function listAllProducts(supabase: SupabaseClient): Promise<PlacementProduct[]> {
  const { data, error } = await supabase
    .from("placement_products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as PlacementProduct[];
}

export type ProductInput = Partial<Omit<PlacementProduct, "id" | "created_at" | "updated_at">> & {
  name: string;
  placement_type: PlacementProduct["placement_type"];
  monthly_price_pence: number;
};

export async function createProduct(supabase: SupabaseClient, input: ProductInput): Promise<PlacementProduct> {
  const { data, error } = await supabase.from("placement_products").insert(input).select("*").single();
  if (error) throw new Error(error.message);
  return data as PlacementProduct;
}

export async function updateProduct(
  supabase: SupabaseClient,
  productId: string,
  patch: Partial<ProductInput>,
): Promise<void> {
  const { error } = await supabase.from("placement_products").update(patch).eq("id", productId);
  if (error) throw new Error(error.message);
}
