import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSubscription } from "@/services/agent/agent-billing-service";
import { SubscriptionBilling } from "@/components/dashboard/agent/billing/SubscriptionBilling";
import type {
  StripeSubscriptionSummary,
  StripeInvoiceSummary,
} from "@/components/dashboard/agent/billing/SubscriptionBilling";
import Stripe from "stripe";

/**
 * Maps a Stripe.Subscription to the lightweight summary type used by
 * SubscriptionBilling. Keeping the Stripe SDK types out of the Client Component.
 */
function toSubscriptionSummary(
  sub: Stripe.Subscription,
): StripeSubscriptionSummary {
  const item = sub.items.data[0];
  const price = item?.price;
  return {
    id: sub.id,
    status: sub.status,
    plan_name:
      typeof price?.product === "object" && price.product !== null
        ? ((price.product as { name?: string }).name ?? "")
        : "",
    price_amount: price?.unit_amount ?? 0,
    currency: price?.currency ?? "gbp",
    interval: price?.recurring?.interval ?? "month",
    current_period_end: (sub as unknown as { current_period_end: number })
      .current_period_end,
    cancel_at_period_end: sub.cancel_at_period_end,
  };
}

/**
 * Fetches up to 10 invoices for the agent's Stripe customer.
 * Returns [] if the customer has no Stripe ID or if Stripe is unavailable.
 */
async function getRecentInvoices(customerId: string): Promise<StripeInvoiceSummary[]> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return [];

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(key);
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 10,
    });
    return invoices.data.map((inv) => ({
      id: inv.id,
      created: inv.created,
      amount_paid: inv.amount_paid,
      currency: inv.currency,
      status: inv.status ?? "unknown",
      invoice_pdf: inv.invoice_pdf ?? null,
    }));
  } catch {
    return [];
  }
}

export default async function AgentBillingPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  let subscriptionSummary: StripeSubscriptionSummary | null = null;
  let invoices: StripeInvoiceSummary[] = [];

  try {
    const sub = await getCurrentSubscription(supabase, user.id);
    if (sub) {
      subscriptionSummary = toSubscriptionSummary(sub);

      // Fetch invoices only when a subscription exists
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? "";
      if (customerId) {
        invoices = await getRecentInvoices(customerId);
      }
    }
  } catch {
    // Stripe may be unconfigured in dev — render no-plan state gracefully
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Subscription &amp; Billing
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your Britestate subscription and payment details.
        </p>
      </div>
      <SubscriptionBilling
        subscription={subscriptionSummary}
        invoices={invoices}
      />
    </div>
  );
}
