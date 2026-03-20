/**
 * Multi-role billing service — Stripe subscription management, checkout,
 * customer portal, and invoice retrieval.
 *
 * This supersedes src/services/agent/agent-billing-service.ts which remains
 * for backwards-compatibility with the existing agent dashboard component.
 *
 * @see src/lib/billing-config.ts for price IDs and plan definitions.
 */
import "server-only";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BillingRole } from "@/lib/billing-config";
import { getStripe } from "@/lib/stripe";

// ============================================================================
// Types
// ============================================================================

export type SubscriptionSummary = {
  id: string;
  stripeSubscriptionId: string | null;
  status: string;
  planName: string | null;
  priceAmount: number | null;
  currency: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  role: string | null;
};

export type InvoiceSummary = {
  id: string;
  created: number;
  amountPaid: number;
  currency: string;
  status: string;
  invoicePdf: string | null;
  description: string | null;
};

export type PaymentMethodSummary = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
};

// ============================================================================
// Helpers
// ============================================================================

async function getCustomerId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();
  return (data as { stripe_customer_id: string | null } | null)?.stripe_customer_id ?? null;
}

// ============================================================================
// Subscription management
// ============================================================================

/**
 * Returns the user's current subscription from the Supabase cache.
 * Falls back to null if no subscription record exists.
 * This is the preferred read path — no Stripe API call required.
 */
export async function getSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<SubscriptionSummary | null> {
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id as string,
    stripeSubscriptionId: (data.stripe_subscription_id as string | null) ?? null,
    status: (data.status as string) ?? "inactive",
    planName: (data.plan_name as string | null) ?? null,
    priceAmount: (data.price_amount as number | null) ?? null,
    currency: (data.currency as string) ?? "gbp",
    currentPeriodEnd: (data.current_period_end as string | null) ?? null,
    cancelAtPeriodEnd: Boolean(data.cancel_at_period_end),
    role: (data.role as string | null) ?? null,
  };
}

/**
 * Creates a Stripe Embedded Checkout session for a subscription plan.
 * Returns { clientSecret } for use with `<EmbeddedCheckout>`.
 * Caller must validate priceId against allowlist before calling.
 */
export async function createSubscriptionCheckout(
  userId: string,
  priceId: string,
  returnUrl: string,
  role: BillingRole,
): Promise<{ clientSecret: string }> {
  const stripe = getStripe();

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    ui_mode: "embedded",
    line_items: [{ price: priceId, quantity: 1 }],
    return_url: returnUrl,
    client_reference_id: userId,
    metadata: { user_id: userId, role },
    billing_address_collection: "auto",
    tax_id_collection: { enabled: true },
  };

  // Attach existing customer if available
  // Note: requires service-role client — not available here (server action context)
  // The webhook will create/link the customer on checkout.session.completed

  const session = await stripe.checkout.sessions.create(sessionParams);
  if (!session.client_secret) throw new Error("Stripe did not return a client secret");
  return { clientSecret: session.client_secret };
}

/**
 * Creates a Stripe Embedded Checkout session for a one-time payment (e.g., featured boost).
 * Returns { clientSecret } for use with `<EmbeddedCheckout>`.
 */
export async function createOneTimeCheckout(
  userId: string,
  priceId: string,
  returnUrl: string,
  metadata?: Record<string, string>,
): Promise<{ clientSecret: string }> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    ui_mode: "embedded",
    line_items: [{ price: priceId, quantity: 1 }],
    return_url: returnUrl,
    client_reference_id: userId,
    metadata: { user_id: userId, ...metadata },
  });

  if (!session.client_secret) throw new Error("Stripe did not return a client secret");
  return { clientSecret: session.client_secret };
}

/**
 * Creates a Stripe Customer Portal session for subscription management.
 * Requires the user to already have a stripe_customer_id.
 */
export async function createPortalSession(
  supabase: SupabaseClient,
  userId: string,
  returnUrl: string,
): Promise<string> {
  const stripe = getStripe();
  const customerId = await getCustomerId(supabase, userId);

  if (!customerId) {
    throw new Error("No Stripe customer ID found — user has not subscribed yet");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

// ============================================================================
// Invoices
// ============================================================================

/**
 * Returns the last N invoices for the authenticated user.
 * Requires the user to have a stripe_customer_id.
 * Returns empty array gracefully if no customer.
 */
export async function getInvoices(
  supabase: SupabaseClient,
  userId: string,
  limit = 24,
): Promise<InvoiceSummary[]> {
  const stripe = getStripe();
  const customerId = await getCustomerId(supabase, userId);
  if (!customerId) return [];

  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  });

  return invoices.data.map((inv) => ({
    id: inv.id,
    created: inv.created,
    amountPaid: inv.amount_paid,
    currency: inv.currency,
    status: inv.status ?? "unknown",
    invoicePdf: inv.invoice_pdf ?? null,
    description: inv.description ?? null,
  }));
}

/**
 * Re-fetches a single invoice to get a fresh PDF URL (Stripe URLs expire).
 */
export async function refreshInvoicePdf(
  invoiceId: string,
): Promise<string | null> {
  const stripe = getStripe();
  const invoice = await stripe.invoices.retrieve(invoiceId);
  return invoice.invoice_pdf ?? null;
}

// ============================================================================
// Payment methods
// ============================================================================

/**
 * Returns all saved payment methods for the user.
 */
export async function getPaymentMethods(
  supabase: SupabaseClient,
  userId: string,
): Promise<PaymentMethodSummary[]> {
  const stripe = getStripe();
  const customerId = await getCustomerId(supabase, userId);
  if (!customerId) return [];

  const [pms, customer] = await Promise.all([
    stripe.paymentMethods.list({ customer: customerId, type: "card" }),
    stripe.customers.retrieve(customerId),
  ]);

  const defaultPmId =
    !customer.deleted &&
    typeof customer.invoice_settings?.default_payment_method === "string"
      ? customer.invoice_settings.default_payment_method
      : null;

  return pms.data.map((pm) => ({
    id: pm.id,
    brand: pm.card?.brand ?? "unknown",
    last4: pm.card?.last4 ?? "****",
    expMonth: pm.card?.exp_month ?? 0,
    expYear: pm.card?.exp_year ?? 0,
    isDefault: pm.id === defaultPmId,
  }));
}

/**
 * Detaches a payment method from the customer.
 * Throws if the method is the user's only payment method and they have an
 * active or trialing subscription, preventing a silent renewal failure.
 */
export async function detachPaymentMethod(
  supabase: SupabaseClient,
  userId: string,
  pmId: string,
): Promise<void> {
  const stripe = getStripe();
  const customerId = await getCustomerId(supabase, userId);

  if (customerId) {
    const [pms, { data: activeSub }] = await Promise.all([
      stripe.paymentMethods.list({ customer: customerId, type: "card" }),
      supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .in("status", ["active", "trialing"])
        .limit(1)
        .maybeSingle(),
    ]);

    const isLastMethod = pms.data.length <= 1;
    if (isLastMethod && activeSub) {
      throw new Error(
        "Cannot remove your only payment method while you have an active subscription. Please add a new card first.",
      );
    }
  }

  await stripe.paymentMethods.detach(pmId);
}

/**
 * Sets a payment method as the customer's default.
 */
export async function setDefaultPaymentMethod(
  supabase: SupabaseClient,
  userId: string,
  pmId: string,
): Promise<void> {
  const stripe = getStripe();
  const customerId = await getCustomerId(supabase, userId);
  if (!customerId) throw new Error("No customer ID found");

  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: pmId },
  });
}

// ============================================================================
// Proration preview
// ============================================================================

/**
 * Returns the prorated amount due if the user upgrades to a new price.
 * Used on the upgrade confirmation screen.
 */
export async function getUpcomingInvoice(
  supabase: SupabaseClient,
  userId: string,
  newPriceId: string,
): Promise<{ amountDue: number; currency: string } | null> {
  const stripe = getStripe();
  const customerId = await getCustomerId(supabase, userId);
  if (!customerId) return null;

  // Get active subscription
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });

  const sub = subscriptions.data[0];
  if (!sub) return null;

  const upcomingInvoice = await stripe.invoices.createPreview({
    customer: customerId,
    subscription: sub.id,
    subscription_details: {
      items: [
        {
          id: sub.items.data[0].id,
          price: newPriceId,
        },
      ],
    },
  });

  return {
    amountDue: upcomingInvoice.amount_due,
    currency: upcomingInvoice.currency,
  };
}

// ============================================================================
// Checkout session retrieval (for confirmation page)
// ============================================================================

/**
 * Retrieves a Stripe Checkout session by ID.
 * Used on the confirmation page to display accurate payment details.
 * sessionId comes from the success_url ?session_id={CHECKOUT_SESSION_ID} param.
 */
export async function getCheckoutSession(
  sessionId: string,
): Promise<{ status: string; customerEmail: string | null; amountTotal: number | null } | null> {
  const stripe = getStripe();
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });
    return {
      status: session.status ?? "unknown",
      customerEmail: session.customer_details?.email ?? null,
      amountTotal: session.amount_total,
    };
  } catch {
    return null;
  }
}
