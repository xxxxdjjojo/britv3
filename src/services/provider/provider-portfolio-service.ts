/**
 * provider-portfolio-service.ts
 *
 * Portfolio item management for the provider dashboard.
 * Supports ordering, before/after image storage, and batch reordering.
 * All functions accept a SupabaseClient so they work in both server and client contexts.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ProviderPortfolioItem } from "@/types/provider-dashboard";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export type AddPortfolioItemInput = Readonly<{
  title: string;
  description?: string;
  category?: string;
  before_image_path?: string;
  after_image_path?: string;
}>;

export type UpdatePortfolioItemInput = Partial<
  Pick<
    ProviderPortfolioItem,
    "title" | "description" | "category" | "before_image_path" | "after_image_path" | "is_featured"
  >
>;

// ---------------------------------------------------------------------------
// getPortfolioItems
// ---------------------------------------------------------------------------

/**
 * Returns all portfolio items for the given provider ordered by display_order ASC.
 */
export async function getPortfolioItems(
  supabase: SupabaseClient,
  providerId: string,
): Promise<ProviderPortfolioItem[]> {
  const { data, error } = await supabase
    .from("provider_portfolio_items")
    .select("*")
    .eq("provider_id", providerId)
    .order("display_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ProviderPortfolioItem[];
}

// ---------------------------------------------------------------------------
// addPortfolioItem
// ---------------------------------------------------------------------------

/**
 * Inserts a new portfolio item for the given provider.
 * Automatically sets display_order to MAX(existing) + 1.
 * Returns the newly created row.
 */
export async function addPortfolioItem(
  supabase: SupabaseClient,
  providerId: string,
  input: AddPortfolioItemInput,
): Promise<ProviderPortfolioItem> {
  // Determine next display_order
  const { data: maxRow } = await supabase
    .from("provider_portfolio_items")
    .select("display_order")
    .eq("provider_id", providerId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = maxRow ? (maxRow as { display_order: number }).display_order + 1 : 1;

  const { data, error } = await supabase
    .from("provider_portfolio_items")
    .insert({
      provider_id: providerId,
      title: input.title,
      description: input.description ?? null,
      category: input.category ?? null,
      before_image_path: input.before_image_path ?? null,
      after_image_path: input.after_image_path ?? null,
      is_featured: false,
      display_order: nextOrder,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as ProviderPortfolioItem;
}

// ---------------------------------------------------------------------------
// updatePortfolioItem
// ---------------------------------------------------------------------------

/**
 * Updates a portfolio item. Ownership check: throws if item does not belong
 * to the given provider.
 * Returns the updated row.
 */
export async function updatePortfolioItem(
  supabase: SupabaseClient,
  providerId: string,
  itemId: string,
  updates: UpdatePortfolioItemInput,
): Promise<ProviderPortfolioItem> {
  // Ownership check
  const { data: existing, error: fetchError } = await supabase
    .from("provider_portfolio_items")
    .select("provider_id")
    .eq("id", itemId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!existing) throw new Error(`Portfolio item ${itemId} not found`);
  if ((existing as { provider_id: string }).provider_id !== providerId) {
    throw new Error("Authorization error: portfolio item belongs to a different provider");
  }

  const { data, error } = await supabase
    .from("provider_portfolio_items")
    .update(updates)
    .eq("id", itemId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as ProviderPortfolioItem;
}

// ---------------------------------------------------------------------------
// deletePortfolioItem
// ---------------------------------------------------------------------------

/**
 * Deletes a portfolio item and removes any associated storage files.
 * Ownership check: throws if item does not belong to the given provider.
 */
export async function deletePortfolioItem(
  supabase: SupabaseClient,
  providerId: string,
  itemId: string,
): Promise<void> {
  // Fetch the item to verify ownership and get storage paths
  const { data: existing, error: fetchError } = await supabase
    .from("provider_portfolio_items")
    .select("provider_id, before_image_path, after_image_path")
    .eq("id", itemId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!existing) throw new Error(`Portfolio item ${itemId} not found`);

  const item = existing as {
    provider_id: string;
    before_image_path: string | null;
    after_image_path: string | null;
  };

  if (item.provider_id !== providerId) {
    throw new Error("Authorization error: portfolio item belongs to a different provider");
  }

  // Remove storage files (non-fatal — log and continue)
  const pathsToRemove: string[] = [];
  if (item.before_image_path) pathsToRemove.push(item.before_image_path);
  if (item.after_image_path) pathsToRemove.push(item.after_image_path);

  if (pathsToRemove.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("portfolio")
      .remove(pathsToRemove);

    if (storageError) {
      // Non-fatal: storage removal failure should not block DB deletion
      console.warn(`Storage removal warning for item ${itemId}:`, storageError.message);
    }
  }

  // Delete the DB row
  const { error: deleteError } = await supabase
    .from("provider_portfolio_items")
    .delete()
    .eq("id", itemId);

  if (deleteError) throw new Error(deleteError.message);
}

// ---------------------------------------------------------------------------
// reorderPortfolioItems
// ---------------------------------------------------------------------------

/**
 * Batch-updates display_order for a list of item IDs provided in the desired order.
 * Each id in orderedIds receives display_order = index + 1.
 * Ownership is implicitly enforced by the Supabase RLS policy; however we also
 * verify the provider owns all items before writing.
 */
export async function reorderPortfolioItems(
  supabase: SupabaseClient,
  providerId: string,
  orderedIds: string[],
): Promise<void> {
  if (orderedIds.length === 0) return;

  // Verify ownership of all items
  const { data: items, error: fetchError } = await supabase
    .from("provider_portfolio_items")
    .select("id, provider_id")
    .in("id", orderedIds);

  if (fetchError) throw new Error(fetchError.message);

  const itemList = (items ?? []) as { id: string; provider_id: string }[];
  for (const item of itemList) {
    if (item.provider_id !== providerId) {
      throw new Error(`Authorization error: item ${item.id} belongs to a different provider`);
    }
  }

  // Batch update display_order
  const updates = orderedIds.map((id, index) =>
    supabase
      .from("provider_portfolio_items")
      .update({ display_order: index + 1 })
      .eq("id", id)
      .eq("provider_id", providerId),
  );

  const results = await Promise.all(updates);
  for (const result of results) {
    if (result.error) throw new Error(result.error.message);
  }
}
