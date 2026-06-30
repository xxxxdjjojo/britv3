/**
 * placement-fulfillment.ts
 *
 * Stripe webhook fulfilment for boost subscriptions. Called from
 * processStripeEvent (so the Inngest DLQ replay path re-runs the same code).
 *
 * Flow:
 *  - checkout.session.completed (mode=subscription, metadata.placement_intent)
 *      → create the sponsored_placements row, status 'active'.
 *  - customer.subscription.deleted → mark the matching placement 'cancelled'.
 *  - invoice.payment_succeeded     → extend current_period_end (renewal).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import type { ServiceCategory } from "@/types/marketplace";
import type { PlacementType } from "@/types/sponsored-placements";

type ServiceCategoryNullable = ServiceCategory | null;

type CheckoutLike = { mode?: string | null; metadata?: Record<string, string> | null };

export function isPlacementCheckout(session: CheckoutLike): boolean {
  return session.mode === "subscription" && session.metadata?.placement_intent === "1";
}

function emptyToNull(value: string | undefined | null): string | null {
  return value && value.trim().length > 0 ? value : null;
}

const VALID_PLACEMENT_TYPES: ReadonlySet<string> = new Set([
  "town_boost",
  "postcode_boost",
  "property_detail_boost",
  "category_leader",
]);

export type PlacementInsert = {
  provider_id: string;
  product_id: string | null;
  placement_type: PlacementType;
  category: ServiceCategoryNullable;
  region_scope: string | null;
  town: string | null;
  postcode_district: string | null;
  status: "active" | "pending_review";
  monthly_price_pence: number;
  stripe_subscription_id: string;
  stripe_customer_id: string | null;
  starts_at: string;
  current_period_end: string | null;
};

export function placementInsertFromMetadata(
  metadata: Record<string, string>,
  stripeRefs: { subscriptionId: string; customerId: string | null; currentPeriodEnd: string | null },
  now: Date = new Date(),
): PlacementInsert {
  if (!metadata.provider_id) throw new Error("Placement checkout metadata missing provider_id");
  if (!VALID_PLACEMENT_TYPES.has(metadata.placement_type)) {
    throw new Error(`Placement checkout metadata has invalid placement_type: ${metadata.placement_type}`);
  }
  return {
    provider_id: metadata.provider_id,
    product_id: emptyToNull(metadata.product_id),
    placement_type: metadata.placement_type as PlacementType,
    category: emptyToNull(metadata.category) as ServiceCategoryNullable,
    region_scope: emptyToNull(metadata.region_scope),
    town: emptyToNull(metadata.town),
    postcode_district: emptyToNull(metadata.postcode_district),
    status: "active",
    monthly_price_pence: Number.parseInt(metadata.monthly_price_pence ?? "0", 10) || 0,
    stripe_subscription_id: stripeRefs.subscriptionId,
    stripe_customer_id: stripeRefs.customerId,
    starts_at: now.toISOString(),
    current_period_end: stripeRefs.currentPeriodEnd,
  };
}

/** Creates the placement row on successful boost checkout. Idempotent on subscription id. */
export async function fulfilPlacementCheckout(
  supabase: SupabaseClient,
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const metadata = (session.metadata ?? {}) as Record<string, string>;
  const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (!subId) throw new Error("Placement checkout completed without a subscription id");

  const subscription = await stripe.subscriptions.retrieve(subId);
  const item = subscription.items.data[0];
  const currentPeriodEnd = item?.current_period_end
    ? new Date(item.current_period_end * 1000).toISOString()
    : null;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const row = placementInsertFromMetadata(metadata, { subscriptionId: subId, customerId, currentPeriodEnd });

  // Trust the amount Stripe actually charged over the (server-set) metadata value.
  const chargedPence = item?.price?.unit_amount;
  if (typeof chargedPence === "number" && chargedPence >= 0) {
    row.monthly_price_pence = chargedPence;
  }

  // Belt-and-braces over-sell guard: if the slot cap was reached between checkout
  // and payment (race), park this placement for admin review instead of pushing
  // it live. The advertiser is not silently dropped — admin can resolve/refund.
  if (row.product_id) {
    row.status = await resolvePlacementStatus(supabase, row, subId);
  }

  const { error } = await supabase
    .from("sponsored_placements")
    .upsert(row, { onConflict: "stripe_subscription_id" });
  if (error) throw new Error(`Failed to create sponsored placement: ${error.message}`);
}

/** Decides whether a newly paid placement can go live or must await review (slot cap). */
async function resolvePlacementStatus(
  supabase: SupabaseClient,
  row: PlacementInsert,
  subscriptionId: string,
): Promise<"active" | "pending_review"> {
  const { data: product } = await supabase
    .from("placement_products")
    .select("slot_limit")
    .eq("id", row.product_id)
    .maybeSingle();
  const slotLimit = (product as { slot_limit: number } | null)?.slot_limit;
  if (slotLimit == null || slotLimit <= 0) return "active";

  let q = supabase
    .from("sponsored_placements")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .eq("placement_type", row.placement_type)
    .neq("stripe_subscription_id", subscriptionId);
  q = row.category ? q.eq("category", row.category) : q.is("category", null);
  q = row.town ? q.eq("town", row.town) : q.is("town", null);
  q = row.postcode_district ? q.eq("postcode_district", row.postcode_district) : q.is("postcode_district", null);
  q = row.region_scope ? q.eq("region_scope", row.region_scope) : q.is("region_scope", null);

  const { count } = await q;
  return (count ?? 0) >= slotLimit ? "pending_review" : "active";
}

/** Marks a placement cancelled when its Stripe subscription ends. */
export async function cancelPlacementBySubscription(
  supabase: SupabaseClient,
  subscriptionId: string,
): Promise<void> {
  const { error } = await supabase
    .from("sponsored_placements")
    .update({ status: "cancelled" })
    .eq("stripe_subscription_id", subscriptionId);
  if (error) throw new Error(error.message);
}

/** Extends the billing period on a successful recurring invoice. */
export async function renewPlacementBySubscription(
  supabase: SupabaseClient,
  subscriptionId: string,
  currentPeriodEnd: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("sponsored_placements")
    .update({ current_period_end: currentPeriodEnd })
    .eq("stripe_subscription_id", subscriptionId);
  if (error) throw new Error(error.message);
}
