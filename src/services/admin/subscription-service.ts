/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import type { SupabaseClient } from "@supabase/supabase-js";
import { AdminActionError } from "@/lib/audited-admin-action";

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
  if (error) {
    console.error("[admin:subscription-service] getSubscriptions failed", { error: error.message });
    return [];
  }
  return (data as AdminSubscription[]) ?? [];
}

export async function cancelSubscription(
  supabase: SupabaseClient,
  subscriptionId: string,
): Promise<{ success: boolean }> {
  const { data: subData, error: fetchError } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("id", subscriptionId)
    .single();

  if (fetchError || !subData?.stripe_subscription_id) {
    throw new AdminActionError("No Stripe subscription found", 400);
  }

  const stripeSubId = subData.stripe_subscription_id as string;

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new AdminActionError("Stripe not configured", 503);
  }

  const res = await fetch(
    `https://api.stripe.com/v1/subscriptions/${stripeSubId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${stripeKey}` },
    },
  );

  if (!res.ok) {
    throw new AdminActionError("Stripe cancellation failed", 502);
  }

  const { error: dbError } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("id", subscriptionId);

  if (dbError) {
    console.error(
      "[admin:subscription] ALERT: Stripe cancelled but DB update failed",
      { subscriptionId, error: dbError },
    );
  }

  return { success: true };
}
