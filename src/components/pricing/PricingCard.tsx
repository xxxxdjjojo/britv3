// src/components/pricing/PricingCard.tsx
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import type { CheckoutCtaPayload } from "./types";

export type PricingCardProps = Readonly<{
  planId: string;
  name: string;
  audience: string;
  segment: string;
  pricingType: "subscription" | "one_off";
  priceIdMonthly: string;
  priceIdAnnual: string;
  monthlyPricePence: number;
  annualPricePence: number;
  features: readonly string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
  annual: boolean;
  badge?: string;
  commissionLabel?: string;
  experimentHighlight?: boolean;
}>;

function formatGBP(pence: number): string {
  if (pence === 0) return "Free";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  }).format(pence / 100);
}

function priceSuffix(
  pricingType: "subscription" | "one_off",
  isFree: boolean,
): string {
  if (isFree) return "";
  return pricingType === "one_off" ? " one-off" : "/mo";
}

export function PricingCard(props: PricingCardProps) {
  const {
    planId,
    name,
    audience,
    segment,
    pricingType,
    priceIdMonthly,
    priceIdAnnual,
    monthlyPricePence,
    annualPricePence,
    features,
    cta,
    ctaHref,
    highlighted,
    annual,
    badge,
    commissionLabel,
    experimentHighlight,
  } = props;

  const router = useRouter();
  const isFree =
    pricingType === "subscription"
      ? monthlyPricePence === 0 && annualPricePence === 0
      : monthlyPricePence === 0;

  const displayPrice = (() => {
    if (pricingType === "one_off") return monthlyPricePence;
    if (annual && annualPricePence > 0) return Math.round(annualPricePence / 12);
    return monthlyPricePence;
  })();

  const activeInterval: "monthly" | "annual" | "one_off" =
    pricingType === "one_off" ? "one_off" : annual ? "annual" : "monthly";

  const activePriceId =
    pricingType === "one_off"
      ? priceIdMonthly
      : annual
        ? priceIdAnnual
        : priceIdMonthly;

  const ringColour =
    experimentHighlight || highlighted
      ? "border-[#1B4D3E] ring-2 ring-[#1B4D3E]/20"
      : "border-neutral-200";

  async function handlePaidClick(): Promise<void> {
    const payload: CheckoutCtaPayload = {
      planId,
      priceId: activePriceId,
      interval: activeInterval,
      segment,
    };
    try {
      // Fire-and-forget — the public /pricing page can't complete checkout
      // without auth. Server returns 401; we still navigate to the auth flow
      // so the user can continue. The POST gives PostHog + the intercept
      // test a stable observation point.
      void fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
    } finally {
      router.push(ctaHref);
    }
  }

  return (
    <article
      role="article"
      aria-label={name}
      data-plan-id={planId}
      data-segment={segment}
      data-highlighted={Boolean(experimentHighlight || highlighted)}
      className={`flex flex-col rounded-xl border p-6 ${ringColour}`}
    >
      {badge && (
        <span className="mb-4 inline-flex w-fit rounded-full bg-[#1B4D3E] px-3 py-1 text-xs font-semibold text-white">
          {badge}
        </span>
      )}

      <h3 className="font-heading text-xl font-bold text-neutral-900">{name}</h3>
      <p className="mt-1 text-sm text-neutral-500">{audience}</p>

      <div className="mt-4">
        {isFree ? (
          <p className="text-3xl font-bold text-neutral-900">Free</p>
        ) : (
          <>
            <p className="text-3xl font-bold text-neutral-900">
              {formatGBP(displayPrice)}
              <span className="text-base font-normal text-neutral-500">
                {priceSuffix(pricingType, false)}
              </span>
            </p>
            {pricingType === "subscription" && annual && (
              <p className="mt-1 text-xs text-neutral-500">
                Billed annually ({formatGBP(annualPricePence)}/year)
              </p>
            )}
            {pricingType === "subscription" &&
              annual &&
              annualPricePence < monthlyPricePence * 12 && (
                <p className="mt-0.5 text-xs font-medium text-green-700">
                  Save {formatGBP(monthlyPricePence * 12 - annualPricePence)}
                </p>
              )}
          </>
        )}
        {commissionLabel && (
          <p className="mt-3 text-xs text-neutral-600">
            + {commissionLabel}
          </p>
        )}
      </div>

      <ul className="mt-6 flex-1 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <svg
              className="mt-0.5 size-4 shrink-0 text-[#1B4D3E]"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
            <span className="text-sm text-neutral-700">{feature}</span>
          </li>
        ))}
      </ul>

      {isFree ? (
        <Button
          asChild
          variant={highlighted ? "default" : "outline"}
          className={`mt-8 w-full ${highlighted ? "bg-[#1B4D3E] hover:bg-[#2D7A5F]" : ""}`}
        >
          <Link href={ctaHref}>{cta}</Link>
        </Button>
      ) : (
        <Button
          variant={highlighted || experimentHighlight ? "default" : "outline"}
          className={`mt-8 w-full ${highlighted || experimentHighlight ? "bg-[#1B4D3E] hover:bg-[#2D7A5F]" : ""}`}
          onClick={() => {
            void handlePaidClick();
          }}
        >
          {cta}
        </Button>
      )}
    </article>
  );
}
