"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Zap, Loader2, CheckCircle2 } from "lucide-react";

type BoostOption = {
  id: string;
  label: string;
  duration: string;
  price: string;
  pence: number;
  priceId: string;
  description: string;
  highlighted?: boolean;
};

// Boost options — price IDs come from server; hardcoded here for display only
// The actual checkout uses NEXT_PUBLIC_STRIPE_BOOST_*_PRICE_ID env vars
const BOOST_OPTIONS: BoostOption[] = [
  {
    id: "7d",
    label: "7-Day Boost",
    duration: "7 days",
    price: "£15",
    pence: 1500,
    priceId: process.env.NEXT_PUBLIC_STRIPE_BOOST_7D_PRICE_ID ?? "price_boost_7d_test",
    description: "Get 3x more views for a week",
  },
  {
    id: "14d",
    label: "14-Day Boost",
    duration: "14 days",
    price: "£25",
    pence: 2500,
    priceId: process.env.NEXT_PUBLIC_STRIPE_BOOST_14D_PRICE_ID ?? "price_boost_14d_test",
    description: "Two weeks of premium placement",
    highlighted: true,
  },
  {
    id: "30d",
    label: "30-Day Boost",
    duration: "30 days",
    price: "£45",
    pence: 4500,
    priceId: process.env.NEXT_PUBLIC_STRIPE_BOOST_30D_PRICE_ID ?? "price_boost_30d_test",
    description: "Maximum exposure for a full month",
  },
];

export default function OneTimeCheckoutPage() {
  const params = useParams<{ role: string }>();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId") ?? "";
  const [selectedBoost, setSelectedBoost] = useState<BoostOption | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const basePath = `/dashboard/${params.role}/billing`;

  async function handleCheckout() {
    if (!selectedBoost) {
      toast.error("Please select a boost option");
      return;
    }
    setIsRedirecting(true);
    try {
      const successUrl = `${window.location.origin}${basePath}/confirmation?plan=${encodeURIComponent(selectedBoost.label)}&amount=${selectedBoost.pence}&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}${window.location.pathname}${listingId ? `?listingId=${listingId}` : ""}`;

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price_id: selectedBoost.priceId,
          success_url: successUrl,
          cancel_url: cancelUrl,
          mode: "payment",
          metadata: listingId
            ? {
                listing_id: listingId,
                duration_days: selectedBoost.id.replace("d", ""),
                boost_type: "featured_listing",
              }
            : undefined,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Failed to start checkout");
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start checkout");
      setIsRedirecting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={basePath}><ArrowLeft size={16} /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            Feature Your Listing
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Get premium placement and 3x more views
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {BOOST_OPTIONS.map((boost) => (
          <Card
            key={boost.id}
            onClick={() => setSelectedBoost(boost)}
            className={`relative cursor-pointer transition-all ${
              selectedBoost?.id === boost.id
                ? "border-2 border-[#1B4D3E] ring-2 ring-[#1B4D3E]/10 shadow-md"
                : "hover:shadow-md"
            } ${boost.highlighted ? "border-[#2563EB]" : ""}`}
          >
            {boost.highlighted && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-[#2563EB] px-2.5 py-0.5 text-xs font-medium text-white">
                  Best value
                </span>
              </div>
            )}
            <CardContent className="pt-6 pb-4 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F5EE] dark:bg-[#1B4D3E]/20">
                <Zap className="text-[#1B4D3E] dark:text-emerald-400" size={18} />
              </div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{boost.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{boost.price}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{boost.description}</p>
              {selectedBoost?.id === boost.id && (
                <div className="mt-3 flex items-center justify-center gap-1 text-xs font-medium text-[#1B4D3E] dark:text-emerald-400">
                  <CheckCircle2 size={14} />
                  Selected
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          onClick={() => void handleCheckout()}
          disabled={!selectedBoost || isRedirecting}
          className="bg-[#1B4D3E] text-white hover:bg-[#2D7A5F] gap-2"
        >
          {isRedirecting ? (
            <><Loader2 size={14} className="animate-spin" />Redirecting…</>
          ) : selectedBoost ? (
            `Pay ${selectedBoost.price} — ${selectedBoost.label}`
          ) : (
            "Select a boost option"
          )}
        </Button>
        <Button variant="ghost" asChild>
          <Link href={basePath}>Cancel</Link>
        </Button>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-600">
        One-time payment. Your listing will be featured immediately after payment. All payments processed securely via Stripe.
      </p>
    </div>
  );
}
