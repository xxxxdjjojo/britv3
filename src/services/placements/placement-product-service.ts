/**
 * placement-product-service.ts
 *
 * Reads the admin-managed placement catalogue and counts active slot usage
 * (for over-sell prevention). All prices come from the DB — nothing hardcoded.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { PlacementProduct } from "@/types/sponsored-placements";

export async function listActiveProducts(supabase: SupabaseClient): Promise<PlacementProduct[]> {
  const { data, error } = await supabase
    .from("placement_products")
    .select("*")
    .eq("status", "active")
    .order("monthly_price_pence", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as PlacementProduct[];
}

export async function getProduct(
  supabase: SupabaseClient,
  productId: string,
): Promise<PlacementProduct | null> {
  const { data, error } = await supabase
    .from("placement_products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as PlacementProduct | null) ?? null;
}

/**
 * Counts how many placements are already active for a product's exact targeting
 * (type + category + town + postcode + region). Used to enforce slot caps.
 */
export async function countActiveSlots(
  supabase: SupabaseClient,
  product: Pick<PlacementProduct, "placement_type" | "category" | "town" | "postcode_district" | "region_scope">,
): Promise<number> {
  let q = supabase
    .from("sponsored_placements")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .eq("placement_type", product.placement_type);

  q = product.category ? q.eq("category", product.category) : q.is("category", null);
  q = product.town ? q.eq("town", product.town) : q.is("town", null);
  q = product.postcode_district ? q.eq("postcode_district", product.postcode_district) : q.is("postcode_district", null);
  q = product.region_scope ? q.eq("region_scope", product.region_scope) : q.is("region_scope", null);

  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return count ?? 0;
}
