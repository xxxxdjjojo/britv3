"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, RefreshCw, CreditCard, ArrowRight } from "lucide-react";

export default function PaymentFailedPage() {
  const params = useParams<{ role: string }>();
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
            Payment failed
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            We couldn&apos;t process your payment. This could be due to insufficient funds, an expired card, or your bank declining the transaction.
          </p>
        </div>

        <Card className="border-red-200 bg-white dark:border-red-800 dark:bg-gray-900">
          <CardContent className="py-5">
            <p className="mb-4 text-sm font-medium text-gray-900 dark:text-gray-100">
              What you can do:
            </p>
            <div className="space-y-3 text-sm text-left">
              <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <RefreshCw size={16} className="mt-0.5 shrink-0 text-gray-400" />
                <span>Try again with the same card</span>
              </div>
              <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <CreditCard size={16} className="mt-0.5 shrink-0 text-gray-400" />
                <span>Use a different card or payment method</span>
              </div>
              <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-gray-400" />
                <span>Contact your bank to authorise the transaction</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            className="bg-[#1B4D3E] text-white hover:bg-[#2D7A5F] gap-2"
            asChild
          >
            <Link href={`${basePath}/checkout/subscription`}>
              <RefreshCw size={16} />
              Try again
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
