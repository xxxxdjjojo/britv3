// src/components/pricing/PricingTabs.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { BillingToggle } from "./BillingToggle";
import { PricingCard } from "./PricingCard";
import type { PlanCardData, SegmentTabConfig } from "./types";

type Props = Readonly<{
  tabs: readonly SegmentTabConfig[];
  defaultTab?: string;
}>;

function computeSavingsLabel(plans: readonly PlanCardData[]): string {
  const paid = plans.filter(
    (p) => p.monthlyPricePence > 0 && p.annualPricePence > 0,
  );
  if (paid.length === 0) return "";
  const monthsSaved = Math.max(
    ...paid.map(
      (p) => (p.monthlyPricePence * 12 - p.annualPricePence) / p.monthlyPricePence,
    ),
  );
  const rounded = Math.round(monthsSaved * 10) / 10;
  const label =
    rounded === Math.floor(rounded) ? rounded.toString() : rounded.toFixed(1);
  return `Save ${label} months`;
}

async function postExposure(flag: string, variant: string): Promise<void> {
  try {
    await fetch("/api/experiments/exposure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flag, variant }),
      credentials: "include",
    });
  } catch {
    // Telemetry must never break the UI.
  }
}

export function PricingTabs({ tabs, defaultTab }: Props) {
  const searchParams = useSearchParams();
  const initialTab =
    searchParams.get("tab") ?? defaultTab ?? tabs[0]?.id ?? "sellers";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [annual, setAnnual] = useState(false);
  const exposureFiredRef = useRef(false);

  const currentTab = useMemo(
    () => tabs.find((t) => t.id === activeTab) ?? tabs[0],
    [tabs, activeTab],
  );

  // A/B exposure on the Sellers tab — fire once per session per page load
  const forceVariant = searchParams.get("force_variant");
  useEffect(() => {
    if (!currentTab || currentTab.id !== "sellers") return;
    if (exposureFiredRef.current) return;
    exposureFiredRef.current = true;
    const variant = forceVariant === "plus" ? "plus" : "basic";
    void postExposure("sellers_default_tier", variant);
  }, [currentTab, forceVariant]);

  const savingsLabel = currentTab ? computeSavingsLabel(currentTab.plans) : "";
  const showBillingToggle =
    currentTab !== undefined &&
    currentTab.pricingType !== "one_off" &&
    currentTab.plans.some((p) => p.monthlyPricePence > 0);

  const selectedSellerExperimentVariant =
    currentTab?.id === "sellers" && forceVariant === "plus" ? "plus" : "basic";

  const handleTabKey = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      const next = e.key === "ArrowRight" ? idx + 1 : idx - 1;
      const tab = tabs[(next + tabs.length) % tabs.length];
      if (tab) setActiveTab(tab.id);
    },
    [tabs],
  );

  return (
    <div>
      {/* Tab Navigation */}
      <div role="tablist" aria-label="Pricing segments" className="flex justify-center">
        <div className="inline-flex flex-wrap justify-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1">
          {tabs.map((tab, idx) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={selected}
                aria-controls={`pricing-panel-${tab.id}`}
                id={`pricing-tab-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleTabKey(e, idx)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  selected
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {currentTab && (
        <div
          role="tabpanel"
          id={`pricing-panel-${currentTab.id}`}
          aria-labelledby={`pricing-tab-${currentTab.id}`}
        >
          <p className="mx-auto mt-4 max-w-2xl text-center text-neutral-600">
            {currentTab.description}
          </p>

          {showBillingToggle && (
            <div className="mt-8">
              <BillingToggle
                annual={annual}
                onToggle={setAnnual}
                savingsLabel={savingsLabel}
              />
            </div>
          )}

          <div
            className={`mt-10 grid gap-6 ${
              currentTab.plans.length === 2
                ? "sm:grid-cols-2 max-w-3xl mx-auto"
                : currentTab.plans.length === 4
                  ? "sm:grid-cols-2 lg:grid-cols-4"
                  : "sm:grid-cols-3"
            }`}
          >
            {currentTab.plans.map((plan) => {
              const isExperimentTarget =
                currentTab.id === "sellers" &&
                ((selectedSellerExperimentVariant === "plus" && plan.planId === "seller_plus") ||
                  (selectedSellerExperimentVariant === "basic" && plan.planId === "seller_basic"));
              return (
                <PricingCard
                  key={plan.planId}
                  {...plan}
                  annual={annual}
                  experimentHighlight={isExperimentTarget && plan.planId === "seller_plus"}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
