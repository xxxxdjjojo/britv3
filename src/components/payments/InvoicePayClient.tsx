"use client";

/**
 * InvoicePayClient
 *
 * Account-free invoice payment UI. Shows a trust-led invoice summary and takes
 * card payment via Stripe Elements against a server-created PaymentIntent
 * (POST /api/pay/[token]). The invoice is marked paid by the Stripe webhook;
 * this component shows an optimistic confirmation on client-side success.
 */

import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CheckCircle2, Loader2, Lock, ShieldCheck } from "lucide-react";

import type { PublicInvoiceView } from "@/services/provider/invoice-pay-service";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function formatGbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

type Props = Readonly<{
  token: string;
  invoice: PublicInvoiceView;
}>;

export function InvoicePayClient({ token, invoice }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [paid, setPaid] = useState(invoice.status === "paid");
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`/api/pay/${token}`, { method: "POST" });
      const body = (await res.json()) as { clientSecret?: string; error?: string };
      if (!res.ok || !body.clientSecret) {
        throw new Error(body.error ?? "Unable to start payment. Please try again.");
      }
      setClientSecret(body.clientSecret);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      {/* Branded header */}
      <div className="flex items-center justify-between bg-[#1B4D3E] px-6 py-4 text-white">
        <span className="text-sm font-semibold tracking-wide">TrueDeed</span>
        <StatusBadge status={paid ? "paid" : invoice.status} />
      </div>

      <div className="space-y-6 p-6">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            Invoice {invoice.invoiceNumber}
          </p>
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            From {invoice.providerName}
          </h1>
          {invoice.dueDate && !paid && (
            <p className="text-sm text-neutral-500">Due {invoice.dueDate}</p>
          )}
        </header>

        {/* Line items */}
        <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-100 dark:divide-neutral-800 dark:border-neutral-800">
          {invoice.lineItems.map((item, i) => (
            <li key={i} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-neutral-700 dark:text-neutral-300">
                {item.name}
                {item.quantity > 1 ? ` × ${item.quantity}` : ""}
              </span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {formatGbp(item.total_pence)}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-700">
          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            Total due
          </span>
          <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {formatGbp(invoice.amountPence)}
          </span>
        </div>

        {/* States */}
        {paid ? (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
            <CheckCircle2 className="size-5 shrink-0" />
            <span>This invoice has been paid. Thank you.</span>
          </div>
        ) : !stripePromise ? (
          <p className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
            Payments are not available right now. Please contact your trader.
          </p>
        ) : clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: { theme: "stripe", variables: { colorPrimary: "#1B4D3E" } },
            }}
          >
            <PayForm onPaid={() => setPaid(true)} />
          </Elements>
        ) : (
          <div className="space-y-3">
            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={handleStart}
              disabled={starting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1B4D3E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#163f33] disabled:opacity-60"
            >
              {starting ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              {starting ? "Preparing secure checkout…" : `Pay ${formatGbp(invoice.amountPence)}`}
            </button>
          </div>
        )}

        <p className="flex items-center justify-center gap-1.5 text-xs text-neutral-400">
          <ShieldCheck className="size-3.5" />
          Secured by Stripe · Powered by TrueDeed
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = status === "paid" ? "Paid" : status === "overdue" ? "Overdue" : "Due";
  const tone =
    status === "paid"
      ? "bg-green-100 text-green-800"
      : status === "overdue"
        ? "bg-red-100 text-red-800"
        : "bg-amber-100 text-amber-900";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
      {label}
    </span>
  );
}

function PayForm({ onPaid }: { onPaid: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setFormError(null);
    try {
      // Elements is created with a clientSecret, so confirmPayment is called
      // directly (no elements.submit(), which is for the deferred-intent flow).
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: "if_required",
      });

      if (confirmError) {
        setFormError(confirmError.message ?? "Payment failed. Please try again.");
        return;
      }

      if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
        onPaid();
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {formError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {formError}
        </p>
      )}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1B4D3E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#163f33] disabled:opacity-60"
      >
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
        {submitting ? "Processing…" : "Confirm payment"}
      </button>
    </form>
  );
}
