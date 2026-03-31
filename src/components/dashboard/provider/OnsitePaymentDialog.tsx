"use client";

/**
 * OnsitePaymentDialog
 *
 * Collects on-site card payments from clients using Stripe's PaymentElement.
 * Creates a PaymentIntent via /api/provider/payments/onsite, renders the
 * Stripe PaymentElement inside an Elements provider, then confirms the intent
 * via /api/provider/payments/onsite/confirm.
 *
 * Guards against providers who have not yet enabled Stripe Connect charges.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2, X, CreditCard, AlertTriangle } from "lucide-react";

import { useProvider } from "@/contexts/ProviderContext";
import type { OnsitePaymentIntent } from "@/services/provider/provider-onsite-payment-service";

// ---------------------------------------------------------------------------
// Stripe singleton (loaded once at module level)
// ---------------------------------------------------------------------------

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type OnsitePaymentDialogProps = Readonly<{
  invoiceId: string;
  amountPence: number;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}>;

// ---------------------------------------------------------------------------
// Inner payment form (must be inside <Elements>)
// ---------------------------------------------------------------------------

type PaymentFormProps = Readonly<{
  invoiceId: string;
  amountPence: number;
  onSuccess: () => void;
  onClose: () => void;
}>;

function PaymentForm({ invoiceId, amountPence, onSuccess, onClose }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const amountDisplay = `£${(amountPence / 100).toFixed(2)}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setFormError(null);

    try {
      // Submit the Elements form (validates card details)
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setFormError(submitError.message ?? "Payment details are invalid.");
        setSubmitting(false);
        return;
      }

      // Confirm the payment — Stripe will redirect or return status
      const returnUrl = `${window.location.origin}/dashboard/provider/payments`;
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
        redirect: "if_required",
      });

      if (confirmError) {
        setFormError(confirmError.message ?? "Payment failed. Please try again.");
        setSubmitting(false);
        return;
      }

      // Payment intent confirmed — notify server to mark invoice paid
      if (paymentIntent?.id) {
        const res = await fetch("/api/provider/payments/onsite/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        });

        if (!res.ok) {
          const body = await res.json() as { error?: string };
          toast.error(body.error ?? "Payment captured but invoice update failed.");
        } else {
          toast.success(`Payment of ${amountDisplay} collected successfully.`);
          onSuccess();
          onClose();
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Collecting payment of{" "}
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
          {amountDisplay}
        </span>{" "}
        for invoice <span className="font-mono text-xs">{invoiceId}</span>.
      </p>

      <PaymentElement />

      {formError && (
        <p className="text-sm text-error" role="alert">
          {formError}
        </p>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-4 py-2 text-sm rounded-md border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !stripe}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-brand-primary text-white hover:bg-brand-primary/90 disabled:opacity-50 transition-colors"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Collect {amountDisplay}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main dialog
// ---------------------------------------------------------------------------

export function OnsitePaymentDialog({
  invoiceId,
  amountPence,
  open,
  onClose,
  onSuccess,
}: OnsitePaymentDialogProps) {
  const { chargesEnabled } = useProvider();
  const [paymentIntent, setPaymentIntent] = useState<OnsitePaymentIntent | null>(null);
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Track whether we've already fetched the intent for this dialog open
  const fetchedForRef = useRef<string | null>(null);
  // Use a ref to track active fetch cancellation
  const cancelledRef = useRef(false);

  const fetchPaymentIntent = useCallback(async () => {
    if (!chargesEnabled) return;
    if (fetchedForRef.current === invoiceId && paymentIntent) return;

    cancelledRef.current = false;
    setLoading(true);
    setInitError(null);

    try {
      const res = await fetch("/api/provider/payments/onsite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const body = await res.json() as OnsitePaymentIntent & { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Failed to create payment intent");
      if (!cancelledRef.current) {
        setPaymentIntent(body);
        fetchedForRef.current = invoiceId;
      }
    } catch (err: unknown) {
      if (!cancelledRef.current) {
        setInitError(err instanceof Error ? err.message : "Failed to initialise payment.");
      }
    } finally {
      if (!cancelledRef.current) {
        setLoading(false);
      }
    }
  }, [chargesEnabled, invoiceId, paymentIntent]);

  // Trigger fetch when dialog opens
  useEffect(() => {
    if (open) {
      void fetchPaymentIntent();
      return () => {
        cancelledRef.current = true;
      };
    }
    // Dialog is closing — reset state
    cancelledRef.current = true;
    setPaymentIntent(null);
    setInitError(null);
    fetchedForRef.current = null;
  }, [open, fetchPaymentIntent]);

  if (!open) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Collect on-site payment"
    >
      {/* Panel */}
      <div className="relative w-full max-w-md rounded-2xl bg-card shadow-2xl border border-border p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Collect Payment
          </h2>
          <button
            onClick={onClose}
            aria-label="Close payment dialog"
            className="rounded-md p-1 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stripe Connect not set up */}
        {!chargesEnabled && (
          <div className="flex items-start gap-3 rounded-lg bg-warning-light dark:bg-warning/10 border border-warning/20 dark:border-warning/30 p-4">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning">
                Stripe Connect required
              </p>
              <p className="text-sm text-warning mt-1">
                Set up Stripe Connect first to collect on-site payments. Go to{" "}
                <Link
                  href="/dashboard/provider/payments"
                  className="underline font-medium hover:no-underline"
                >
                  Payments &rarr; Connect
                </Link>{" "}
                to get started.
              </p>
            </div>
          </div>
        )}

        {/* Loading spinner */}
        {chargesEnabled && loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            <p className="text-sm text-neutral-500">Setting up payment…</p>
          </div>
        )}

        {/* Init error */}
        {chargesEnabled && !loading && initError && (
          <div className="flex items-start gap-3 rounded-lg bg-error-light dark:bg-error/10 border border-error/20 dark:border-error/30 p-4">
            <AlertTriangle className="h-5 w-5 text-error shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-error">
                Could not initialise payment
              </p>
              <p className="text-sm text-error mt-1">{initError}</p>
              <button
                onClick={() => {
                  fetchedForRef.current = null;
                  setPaymentIntent(null);
                }}
                className="mt-2 text-sm underline text-error hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Stripe Elements payment form */}
        {chargesEnabled && !loading && paymentIntent?.clientSecret && stripePromise && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: paymentIntent.clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#2563eb",
                  borderRadius: "6px",
                },
              },
            }}
          >
            <PaymentForm
              invoiceId={invoiceId}
              amountPence={amountPence}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </Elements>
        )}

        {/* Stripe not configured (no publishable key) */}
        {chargesEnabled && !loading && !initError && !stripePromise && (
          <p className="text-sm text-error">
            Stripe is not configured. Contact support.
          </p>
        )}
      </div>
    </div>
  );
}
