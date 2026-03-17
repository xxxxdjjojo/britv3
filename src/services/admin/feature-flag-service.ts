import type { SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache, revalidateTag } from "next/cache";

export type FeatureFlag = {
  key: string;
  enabled: boolean;
  rollout_pct: number;
  allowed_roles: string[] | null;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
};

export const getFeatureFlags = unstable_cache(
  async (): Promise<FeatureFlag[]> => {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("feature_flags")
        .select(
          "key, enabled, rollout_pct, allowed_roles, description, updated_at, updated_by",
        );
      return (data as FeatureFlag[]) ?? [];
    } catch {
      // Feature flags default to empty (all off) on error
      return [];
    }
  },
  ["feature-flags"],
  { revalidate: 60 },
);

export async function toggleFlag(
  supabase: SupabaseClient,
  key: string,
  enabled: boolean,
  adminId: string,
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from("feature_flags")
    .update({
      enabled,
      updated_at: new Date().toISOString(),
      updated_by: adminId,
    })
    .eq("key", key);

  if (!error) revalidateTag("feature-flags");
  return { success: !error };
}

export async function setRollout(
  supabase: SupabaseClient,
  key: string,
  rolloutPct: number,
  adminId: string,
): Promise<{ success: boolean; error?: string }> {
  if (rolloutPct < 0 || rolloutPct > 100) {
    return { success: false, error: "rollout_pct must be between 0 and 100" };
  }

  const { error } = await supabase
    .from("feature_flags")
    .update({
      rollout_pct: rolloutPct,
      updated_at: new Date().toISOString(),
      updated_by: adminId,
    })
    .eq("key", key);

  if (!error) revalidateTag("feature-flags");
  return { success: !error };
}
