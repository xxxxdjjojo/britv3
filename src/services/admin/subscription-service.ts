import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminSubscription = {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  created_at: string;
};

export async function getSubscriptions(
  supabase: SupabaseClient,
): Promise<AdminSubscription[]> {
  // TODO: integrate with Stripe API for live data
  // For now return DB subscriptions
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, user_id, plan, status, created_at")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data as AdminSubscription[]) ?? [];
}

export async function cancelSubscription(
  supabase: SupabaseClient,
  subscriptionId: string,
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("id", subscriptionId);
  return { success: !error };
}
