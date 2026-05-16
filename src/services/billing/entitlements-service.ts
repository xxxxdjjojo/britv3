// src/services/billing/entitlements-service.ts
/**
 * Entitlements service — single source of truth for "can user X do Y?"
 *
 * Combines subscription plan data with feature entitlements.
 * Future: will also incorporate referral tier bonuses.
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserEntitlements } from "@/types/entitlements";
import { getEntitlementsForPlan } from "@/lib/plan-entitlements";
import { captureException } from "@/lib/observability/capture-exception";

const ACTIVE_STATUSES = ["active", "trialing"] as const;

/**
 * Get the full entitlements for a user based on their subscription.
 * Returns empty features if no active subscription exists.
 */
export async function getUserEntitlements(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserEntitlements> {
  try {
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("plan_name, status")
      .eq("user_id", userId)
      .in("status", ACTIVE_STATUSES as unknown as string[])
      .maybeSingle();

    if (error) {
      captureException(error, {
        module: "billing",
        feature: "entitlements",
        operation: "getUserEntitlements",
      });
      console.error("[entitlements] DB query failed for user", userId, error.message);
      return { planId: null, planName: null, features: new Set() };
    }

    const sub = subscription as { plan_name: string; status: string } | null;

    if (!sub || !(ACTIVE_STATUSES as readonly string[]).includes(sub.status)) {
      return { planId: null, planName: null, features: new Set() };
    }

    const features = getEntitlementsForPlan(sub.plan_name);

    return {
      planId: sub.plan_name,
      planName: sub.plan_name,
      features,
    };
  } catch (err) {
    captureException(err, {
      module: "billing",
      feature: "entitlements",
      operation: "getUserEntitlements",
    });
    console.error("[entitlements] Unexpected error for user", userId, err);
    return { planId: null, planName: null, features: new Set() };
  }
}
