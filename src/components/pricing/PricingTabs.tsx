// src/components/pricing/PricingTabs.tsx
"use client";

import { useState } from "react";
import { BillingToggle } from "./BillingToggle";
import { PricingCard } from "./PricingCard";

type PlanData = Readonly<{
  name: string;
  audience: string;
  monthlyPricePence: number;
  annualPricePence: number;
  features: readonly string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
  badge?: string;
}>;

type TabConfig = Readonly<{
  id: string;
  label: string;
  description: string;
  plans: readonly PlanData[];
}>;

type Props = Readonly<{
  tabs: readonly TabConfig[];
  defaultTab?: string;
}>;

// [ENG REVIEW 6A] — compute savings label from actual plan prices per tab
function computeSavingsLabel(plans: readonly PlanData[]): string {
  const paidPlans = plans.filter((p) => p.monthlyPricePence > 0);
  if (paidPlans.length === 0) return "";
  // Find the maximum months saved across plans in this tab
  const maxMonthsSaved = Math.max(
    ...paidPlans.map((p) => {
      const yearlyIfMonthly = p.monthlyPricePence * 12;
      const saved = yearlyIfMonthly - p.annualPricePence;
      return saved / p.monthlyPricePence;
    }),
  );
  const rounded = Math.round(maxMonthsSaved * 10) / 10;
  // Format: "Save 2 months" or "Save 2.4 months"
  return `Save ${rounded === Math.floor(rounded) ? rounded : rounded.toFixed(1)} months`;
}

export function PricingTabs({ tabs, defaultTab }: Props) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? "");
  const [annual, setAnnual] = useState(false);

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];
  const savingsLabel = currentTab ? computeSavingsLabel(currentTab.plans) : "";

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Description */}
      {currentTab && (
        <p className="mx-auto mt-4 max-w-2xl text-center text-neutral-600">
          {currentTab.description}
        </p>
      )}

      {/* Billing Toggle — hide for free-only tabs */}
      {currentTab &&
        currentTab.plans.some((p) => p.monthlyPricePence > 0) && (
          <div className="mt-8">
            <BillingToggle annual={annual} onToggle={setAnnual} savingsLabel={savingsLabel} />
          </div>
        )}

      {/* Plan Cards */}
      {currentTab && (
        <div
          className={`mt-10 grid gap-6 ${
            currentTab.plans.length === 2
              ? "sm:grid-cols-2 max-w-3xl mx-auto"
              : "sm:grid-cols-3"
          }`}
        >
          {currentTab.plans.map((plan) => (
            <PricingCard key={plan.name} {...plan} annual={annual} />
          ))}
        </div>
      )}
    </div>
  );
}
