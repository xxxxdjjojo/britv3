// src/components/pricing/PricingCard.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type PricingCardProps = Readonly<{
  name: string;
  audience: string;
  monthlyPricePence: number;
  annualPricePence: number;
  features: readonly string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
  annual: boolean;
  badge?: string;
}>;

function formatGBP(pence: number): string {
  if (pence === 0) return "Free";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  }).format(pence / 100);
}

export function PricingCard({
  name,
  audience,
  monthlyPricePence,
  annualPricePence,
  features,
  cta,
  ctaHref,
  highlighted,
  annual,
  badge,
}: PricingCardProps) {
  const displayPrice = annual
    ? Math.round(annualPricePence / 12)
    : monthlyPricePence;
  const isFree = monthlyPricePence === 0 && annualPricePence === 0;

  return (
    <div
      className={`flex flex-col rounded-xl border p-6 ${
        highlighted
          ? "border-[#1B4D3E] ring-2 ring-[#1B4D3E]/20"
          : "border-neutral-200"
      }`}
    >
      {badge && (
        <span className="mb-4 inline-flex w-fit rounded-full bg-[#1B4D3E] px-3 py-1 text-xs font-semibold text-white">
          {badge}
        </span>
      )}

      <h3 className="font-heading text-xl font-bold text-neutral-900">
        {name}
      </h3>
      <p className="mt-1 text-sm text-neutral-500">{audience}</p>

      <div className="mt-4">
        {isFree ? (
          <p className="text-3xl font-bold text-neutral-900">Free</p>
        ) : (
          <>
            <p className="text-3xl font-bold text-neutral-900">
              {formatGBP(displayPrice)}
              <span className="text-base font-normal text-neutral-500">
                /mo
              </span>
            </p>
            {annual && (
              <p className="mt-1 text-xs text-neutral-500">
                Billed annually ({formatGBP(annualPricePence)}/year)
              </p>
            )}
            {annual && annualPricePence < monthlyPricePence * 12 && (
              <p className="mt-0.5 text-xs font-medium text-green-700">
                Save {formatGBP(monthlyPricePence * 12 - annualPricePence)}
              </p>
            )}
          </>
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

      <Button
        asChild
        variant={highlighted ? "default" : "outline"}
        className={`mt-8 w-full ${
          highlighted ? "bg-[#1B4D3E] hover:bg-[#2D7A5F]" : ""
        }`}
      >
        <Link href={ctaHref}>{cta}</Link>
      </Button>
    </div>
  );
}
