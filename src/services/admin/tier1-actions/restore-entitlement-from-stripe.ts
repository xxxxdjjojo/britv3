import { resolveInternalPlanId } from "@/lib/billing-config";
import type { Tier1Action, Tier1ActionContext } from "./types";
import { Tier1ActionError } from "./types";

/**
 * Reconcile a user's local `subscriptions` row from live Stripe — the remedy
 * for entitlement drift (webhook missed/failed, so Stripe says active but the
 * app shows lapsed, or vice-versa). Stripe is the source of truth.
 *
 * Mirrors the upsert shape of the `checkout.session.completed` handler in
 * `stripe-event-processor.ts` (kept intentionally narrow rather than refactoring
 * that 300-line switch). Reversible: re-running just re-reads Stripe.
 */

async function resolveCustomerId(
  ctx: Tier1ActionContext,
): Promise<string | null> {
  const { data: sub } = await ctx.supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", ctx.targetId)
    .maybeSingle();
  const fromSub = (sub as { stripe_customer_id?: string } | null)?.stripe_customer_id;
  if (fromSub) return fromSub;

  const { data: profile } = await ctx.supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", ctx.targetId)
    .maybeSingle();
  return (profile as { stripe_customer_id?: string } | null)?.stripe_customer_id ?? null;
}

export const restoreEntitlementFromStripe: Tier1Action = {
  key: "restore-entitlement-from-stripe",
  label: "Restore entitlement from Stripe",
  description:
    "Re-read the user's live Stripe subscription and reconcile the local entitlement row. Use when billing state has drifted.",
  requiredPermission: "manage_subscriptions",
  targetType: "user",
  risk: "medium",
  reversible: true,

  async preview(ctx) {
    const customerId = await resolveCustomerId(ctx);
    const blockers: string[] = [];
    if (!customerId) blockers.push("No Stripe customer linked to this account.");
    return {
      summary: customerId
        ? "Re-read the live Stripe subscription and reconcile the local entitlement row."
        : "Cannot reconcile — no Stripe customer on file.",
      effects: [
        "Fetches the customer's current subscription from Stripe.",
        "Upserts the local subscriptions row (status, period end, plan) to match.",
      ],
      reversible: true,
      requiresApproval: false,
      blockers,
    };
  },

  async execute(ctx) {
    const customerId = await resolveCustomerId(ctx);
    if (!customerId) throw new Tier1ActionError("No Stripe customer linked", 422);

    const stripe = ctx.getStripe();
    const list = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });
    const subscription = list.data[0];
    if (!subscription) {
      throw new Tier1ActionError("No Stripe subscription found for this customer", 404);
    }

    const item = subscription.items.data[0];
    const plan = item?.price;
    const { error } = await ctx.supabase.from("subscriptions").upsert(
      {
        user_id: ctx.targetId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        status: subscription.status,
        plan_name: resolveInternalPlanId(plan?.id, plan?.nickname ?? null),
        price_amount: item?.price.unit_amount ?? null,
        currency: plan?.currency ?? "gbp",
        current_period_end: item?.current_period_end
          ? new Date(item.current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Tier1ActionError(`Failed to reconcile: ${error.message}`, 500);

    return {
      summary: `Entitlement reconciled from Stripe — subscription status "${subscription.status}".`,
    };
  },
};
