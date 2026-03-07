/**
 * Saved searches service with alert checking.
 * Handles CRUD for saved search criteria and alert preference management.
 * All functions accept a Supabase client as first parameter for testability.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { SearchFilters } from "@/types/search";
import type { SavedSearch } from "@/types/property";
import { searchProperties } from "@/services/search/search-service";

type AlertPreferences = {
  enabled: boolean;
  frequency: "instant" | "daily" | "weekly";
};

type AlertUpdateInput = {
  alerts_enabled: boolean;
  alert_frequency: string;
};

/**
 * Save search criteria with alert preferences.
 * Filters are stored as JSONB for later re-execution.
 */
export async function saveSearch(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  filters: SearchFilters,
  alertPrefs: AlertPreferences,
): Promise<SavedSearch> {
  const { data, error } = await supabase
    .from("saved_searches")
    .insert({
      user_id: userId,
      name,
      filters,
      alerts_enabled: alertPrefs.enabled,
      alert_frequency: alertPrefs.frequency,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to save search: ${error?.message ?? "Unknown error"}`,
    );
  }

  return data as SavedSearch;
}

/**
 * Delete a saved search. Verifies ownership via user_id match.
 */
export async function deleteSearch(
  supabase: SupabaseClient,
  userId: string,
  searchId: string,
): Promise<void> {
  const { error } = await supabase
    .from("saved_searches")
    .delete()
    .eq("id", searchId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete search: ${error.message}`);
  }
}

/**
 * Get all saved searches for a user, ordered by most recent first.
 */
export async function getSavedSearches(
  supabase: SupabaseClient,
  userId: string,
): Promise<SavedSearch[]> {
  const { data, error } = await supabase
    .from("saved_searches")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to get saved searches: ${error.message}`);
  }

  return (data ?? []) as SavedSearch[];
}

/**
 * Update alert preferences on a saved search.
 */
export async function updateAlertPreferences(
  supabase: SupabaseClient,
  userId: string,
  searchId: string,
  prefs: AlertUpdateInput,
): Promise<SavedSearch> {
  const { data, error } = await supabase
    .from("saved_searches")
    .update({
      alerts_enabled: prefs.alerts_enabled,
      alert_frequency: prefs.alert_frequency,
    })
    .eq("id", searchId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to update alert preferences: ${error?.message ?? "Not found"}`,
    );
  }

  return data as SavedSearch;
}

/**
 * Check for new results matching a saved search's filters.
 * Re-executes the stored filters with listed_after set to last_alerted_at.
 * Updates new_results_count on the saved search record.
 */
export async function checkNewResults(
  supabase: SupabaseClient,
  searchId: string,
): Promise<number> {
  // Load the saved search
  const { data: savedSearch, error: loadError } = await supabase
    .from("saved_searches")
    .select("*")
    .eq("id", searchId)
    .single();

  if (loadError || !savedSearch) {
    throw new Error(
      `Failed to load saved search: ${loadError?.message ?? "Not found"}`,
    );
  }

  // Determine the cutoff date
  const listedAfter = savedSearch.last_alerted_at
    ? savedSearch.last_alerted_at
    : new Date(0).toISOString();

  // Re-execute the saved filters with listed_after constraint
  const filters = savedSearch.filters as SearchFilters;
  const result = await searchProperties({
    ...filters,
    listed_after: listedAfter,
  });

  const count = result.count;

  // Update new_results_count on the saved search (fire-and-forget)
  supabase
    .from("saved_searches")
    .update({ new_results_count: count })
    .eq("id", searchId)
    .then(() => {})
    .catch(() => {});

  return count;
}

/**
 * Mark a saved search as alerted (update last_alerted_at to now).
 */
export async function markAlerted(
  supabase: SupabaseClient,
  searchId: string,
): Promise<void> {
  const { error } = await supabase
    .from("saved_searches")
    .update({
      last_alerted_at: new Date().toISOString(),
      new_results_count: 0,
    })
    .eq("id", searchId);

  if (error) {
    throw new Error(`Failed to mark alerted: ${error.message}`);
  }
}
