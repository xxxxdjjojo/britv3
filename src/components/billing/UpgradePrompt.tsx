// src/components/billing/UpgradePrompt.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { FeatureKey } from "@/types/entitlements";

/**
 * Human-readable labels for features shown in upgrade prompts.
 */
const FEATURE_LABELS: Partial<Record<FeatureKey, string>> = {
  QUOTES_UNLIMITED: "unlimited quote responses",
  LEADS_PRIORITY: "priority lead matching",
  BOOKING_SYSTEM: "integrated booking",
  CRM_BASIC: "CRM tools",
  ANALYTICS_ADVANCED: "advanced analytics",
  API_ACCESS: "API access",
  TEAM_MULTI_USER: "team accounts",
  WHITE_LABEL: "white-label portal",
  LISTINGS_UNLIMITED: "unlimited listings",
  AGENT_CRM: "full CRM suite",
  AGENT_VIEWING_CALENDAR: "viewing calendar",
  PROPERTIES_UNLIMITED: "unlimited properties",
  RENT_COLLECTION: "rent collection tools",
};

// [ENG REVIEW 2B] — planDisplayName is passed as a prop from the server-side
// parent, which resolves it from billing-config.ts. This avoids hardcoding
// prices in a client component (DRY — prices live in one place).
type Props = Readonly<{
  feature: FeatureKey;
  requiredPlanId: string;
  planDisplayName: string;
  role: string;
  message?: string;
}>;

export function UpgradePrompt({ feature, planDisplayName, role, message }: Props) {
  const featureLabel = FEATURE_LABELS[feature] ?? feature.toLowerCase().replace(/_/g, " ");
  const billingUrl = `/dashboard/${role}/billing/checkout/subscription`;

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-6 py-10 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-amber-100">
        <svg
          className="size-6 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-neutral-900">
        Upgrade to unlock {featureLabel}
      </h3>
      <p className="mt-2 max-w-md text-sm text-neutral-600">
        {message ??
          `This feature is available on the ${planDisplayName} plan. Upgrade to get access to ${featureLabel} and more.`}
      </p>
      <Button asChild className="mt-6 bg-[#1B4D3E] hover:bg-[#2D7A5F]">
        <Link href={billingUrl}>Upgrade to {planDisplayName}</Link>
      </Button>
      <Link
        href="/pricing"
        className="mt-3 text-xs text-neutral-500 underline-offset-4 hover:underline"
      >
        Compare all plans
      </Link>
    </div>
  );
}
