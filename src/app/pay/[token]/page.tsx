/**
 * /pay/[token] — account-free invoice payment page.
 *
 * The signed token authorises read + pay access to a single invoice. The page
 * renders a trust-led summary; payment is taken client-side via Stripe Elements
 * against a server-created PaymentIntent, and the invoice is marked paid only by
 * the Stripe webhook.
 */

import type { Metadata } from "next";

import { getInvoiceForPayment } from "@/services/provider/invoice-pay-service";
import { InvoicePayClient } from "@/components/payments/InvoicePayClient";

export const metadata: Metadata = {
  title: "Pay your invoice",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ token: string }> };

export default async function PayInvoicePage({ params }: PageProps) {
  const { token } = await params;
  const invoice = await getInvoiceForPayment(token);

  if (!invoice) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Payment link not found
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            This payment link is invalid or has expired. Please ask your trader
            to resend the invoice.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10 sm:py-16">
      <InvoicePayClient token={token} invoice={invoice} />
    </main>
  );
}
