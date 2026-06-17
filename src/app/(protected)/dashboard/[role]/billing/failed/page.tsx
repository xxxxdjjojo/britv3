"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, RefreshCw, CreditCard, ArrowRight, Phone, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Smart decline_code → user-facing message mapping
// ---------------------------------------------------------------------------

type DeclineInfo = Readonly<{
  title: string;
  message: string;
  advice: string;
}>;

const DECLINE_MESSAGES: Record<string, DeclineInfo> = {
  insufficient_funds: {
    title: "Insufficient funds",
    message: "Your card doesn\u2019t have enough funds for this payment.",
    advice: "Try a different card or add funds to your account.",
  },
  card_declined: {
    title: "Card declined",
    message: "Your bank has declined this transaction.",
    advice: "Contact your bank to authorise the payment, or try a different card.",
  },
  expired_card: {
    title: "Card expired",
    message: "The card you used has expired.",
    advice: "Update your card details or use a different card.",
  },
  incorrect_cvc: {
    title: "Incorrect CVC",
    message: "The security code (CVC) was incorrect.",
    advice: "Check the 3-digit code on the back of your card.",
  },
  processing_error: {
    title: "Processing error",
    message: "There was an issue processing your payment.",
    advice: "Please wait a moment and try again.",
  },
  incorrect_number: {
    title: "Incorrect card number",
    message: "The card number you entered is incorrect.",
    advice: "Double-check your card number and try again.",
  },
  card_not_supported: {
    title: "Card not supported",
    message: "This type of card is not supported for this payment.",
    advice: "Try a different card (Visa, Mastercard, or Amex).",
  },
  currency_not_supported: {
    title: "Currency not supported",
    message: "Your card does not support payments in GBP.",
    advice: "Try a card that supports British pounds, or contact your bank.",
  },
  do_not_honor: {
    title: "Transaction not authorised",
    message: "Your bank has declined the transaction without a specific reason.",
    advice: "Contact your bank to authorise the payment, then try again.",
  },
  fraudulent: {
    title: "Transaction flagged",
    message: "This transaction has been flagged by your bank\u2019s fraud protection.",
    advice: "Contact your bank to confirm the payment is legitimate.",
  },
  lost_card: {
    title: "Card reported lost",
    message: "This card has been reported as lost.",
    advice: "Please use a different payment method.",
  },
  stolen_card: {
    title: "Card reported stolen",
    message: "This card has been reported as stolen.",
    advice: "Please use a different payment method.",
  },
  withdrawal_count_limit_exceeded: {
    title: "Transaction limit reached",
    message: "You\u2019ve exceeded the number of allowed transactions for this card.",
    advice: "Try again later, or use a different card.",
  },
};

const DEFAULT_DECLINE: DeclineInfo = {
  title: "Payment failed",
  message: "We couldn\u2019t process your payment.",
  advice: "Please try again with a different card, or contact your bank for more information.",
};

function PaymentFailedContent() {
  const params = useParams<{ role: string }>();
  const searchParams = useSearchParams();

  const declineCode = searchParams.get("decline_code") ?? "";
  const decline = DECLINE_MESSAGES[declineCode] ?? DEFAULT_DECLINE;

  const basePath = `/dashboard/${params.role}/billing`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-white p-6 dark:from-gray-900 dark:to-gray-950">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Failed icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <AlertCircle className="text-red-500" size={44} />
        </div>

        <div>
          <h1
            className="text-3xl font-bold text-gray-900 dark:text-gray-100"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            {decline.title}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {decline.message}
          </p>
        </div>

        <Card className="border-red-200 bg-white dark:border-red-800 dark:bg-gray-900">
          <CardContent className="py-5">
            <p className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">
              Recommended next step
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {decline.advice}
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <CardContent className="py-5">
            <p className="mb-4 text-sm font-medium text-gray-900 dark:text-gray-100">
              What you can do:
            </p>
            <div className="space-y-3 text-sm text-left">
              <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <RefreshCw size={16} className="mt-0.5 shrink-0 text-gray-400" />
                <span>Try again with the same or a different card</span>
              </div>
              <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <CreditCard size={16} className="mt-0.5 shrink-0 text-gray-400" />
                <Link
                  href={`${basePath}/payment-methods`}
                  className="underline hover:text-brand-primary dark:hover:text-emerald-400"
                >
                  Manage your payment methods
                </Link>
              </div>
              <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <Phone size={16} className="mt-0.5 shrink-0 text-gray-400" />
                <a
                  href="tel:+44"
                  className="underline hover:text-brand-primary dark:hover:text-emerald-400"
                >
                  Contact your bank to authorise the payment
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            className="bg-brand-primary text-white hover:bg-brand-primary-light gap-2"
            asChild
          >
            <Link href={`${basePath}/checkout/subscription`}>
              <CreditCard size={16} />
              Try with different card
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={basePath}>
              Back to billing
              <ArrowRight size={16} className="ml-2" />
            </Link>
          </Button>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-600">
          Your card was not charged. Need help?{" "}
          <a href="mailto:support@britestate.co.uk" className="underline">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <PaymentFailedContent />
    </Suspense>
  );
}
