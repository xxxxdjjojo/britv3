/**
 * Per-request cached data fetchers.
 *
 * React cache() deduplicates calls within a single server render pass.
 * If both a layout and its child page call getCachedUser(), the DB
 * query runs only once.
 */

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Per-request cached current user fetch.
 * Deduplicates supabase.auth.getUser() calls within a single render pass.
 */
export const getCachedUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

/**
 * Per-request cached user profile fetch.
 * Deduplicates profile queries when both layout and page need profile data.
 */
export const getCachedProfile = cache(async () => {
  const user = await getCachedUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, active_role, is_admin, admin_role, first_name, last_name, email, avatar_url")
    .eq("id", user.id)
    .single();
  return data;
});
