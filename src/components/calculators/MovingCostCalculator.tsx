"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Download, FileText, Home } from "lucide-react";
import { calculateSdlt } from "@/lib/calculators/sdlt";
import type { BuyerType } from "@/types/calculators";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

type MovingCostRow = {
  label: string;
  amount: number;
  note?: string;
  editable?: boolean;
};

type MovingCostCalculatorProps = Readonly<{
  initialPrice?: number;
}>;

// Donut chart segment colours (Tailwind-safe inline values using CSS vars)
const SEGMENT_COLORS = [
  "var(--color-brand-primary)",
  "var(--color-brand-secondary)",
  "#4A90A4",
  "#7CB5A0",
  "#B8D4CC",
];

export function MovingCostCalculator({ initialPrice }: MovingCostCalculatorProps = {}) {
  const [propertyPrice, setPropertyPrice] = useState(initialPrice ?? 300000);
  const [buyerType, setBuyerType] = useState<BuyerType>("standard");
  const [isLeasehold, setIsLeasehold] = useState(false);
  const [needsSurvey, setNeedsSurvey] = useState(true);
  const [isRemortgage, setIsRemortgage] = useState(false);
  const [loanAmount, setLoanAmount] = useState(240000);

  // Editable line items
  const [removalCost, setRemovalCost] = useState(1200);
  const [storageNeeded, setStorageNeeded] = useState(false);
  const [storageCost, setStorageCost] = useState(600);
  const [cleaningCost, setCleaningCost] = useState(350);
  const [utilitySetupCost, setUtilitySetupCost] = useState(200);

  const sdltResult = useMemo(
    () => calculateSdlt(propertyPrice, buyerType),
    [propertyPrice, buyerType],
  );

  const costs = useMemo<MovingCostRow[]>(() => {
    // Legal / conveyancing: scales roughly with price
    const conveyancing =
      propertyPrice <= 150000
        ? 850
        : propertyPrice <= 250000
          ? 1100
          : propertyPrice <= 500000
            ? 1400
            : propertyPrice <= 1000000
              ? 1800
              : 2500;

    const leaseholdSupplement = isLeasehold ? 350 : 0;

    // Survey cost
    const surveyFee =
      needsSurvey
        ? propertyPrice <= 150000
          ? 400
          : propertyPrice <= 250000
            ? 500
            : propertyPrice <= 500000
              ? 650
              : 900
        : 0;

    // Mortgage arrangement fee
    const mortgageArrangement = isRemortgage ? 995 : loanAmount > 0 ? 995 : 0;

    // Electronic transfer fee (CHAPS / TT)
    const electronicTransfer = 35;

    // Land Registry fee (sliding scale, approx)
    const landRegistry =
      propertyPrice <= 80000
        ? 20
        : propertyPrice <= 100000
          ? 40
          : propertyPrice <= 200000
            ? 100
            : propertyPrice <= 500000
              ? 270
              : propertyPrice <= 1000000
                ? 540
                : 910;

    // Search fees
    const searchFees = 300;

    const items: MovingCostRow[] = [
      {
        label: "Stamp Duty Land Tax",
        amount: sdltResult.totalTax,
        note: `${(sdltResult.effectiveRate * 100).toFixed(2)}% effective rate`,
      },
      {
        label: "Solicitor Fees",
        amount: conveyancing + leaseholdSupplement,
        note: isLeasehold ? "Includes leasehold supplement" : undefined,
      },
      {
        label: "Search Fees",
        amount: searchFees,
        note: "Local authority, water, environmental",
      },
      {
        label: "Land Registry Fee",
        amount: landRegistry,
      },
      {
        label: "Electronic Transfer Fee",
        amount: electronicTransfer,
      },
    ];

    if (loanAmount > 0 || isRemortgage) {
      items.push({
        label: "Mortgage Arrangement Fee",
        amount: mortgageArrangement,
        note: "May be added to mortgage",
      });
      items.push({
        label: "Mortgage Valuation",
        amount: 300,
        note: "Lender's basic valuation",
      });
    }

    if (needsSurvey) {
      items.push({
        label: "Homebuyer Survey",
        amount: surveyFee,
        note: "Highly recommended",
      });
    }

    items.push({
      label: "Removal Company",
      amount: removalCost,
      editable: true,
    });

    if (storageNeeded) {
      items.push({
        label: "Storage (short-term)",
        amount: storageCost,
        editable: true,
      });
    }

    items.push({
      label: "Professional Cleaning",
      amount: cleaningCost,
      editable: true,
    });

    items.push({
      label: "Utility Setup & Redirections",
      amount: utilitySetupCost,
      editable: true,
    });

    return items;
  }, [
    propertyPrice,
    buyerType,
    isLeasehold,
    needsSurvey,
    isRemortgage,
    loanAmount,
    removalCost,
    storageNeeded,
    storageCost,
    cleaningCost,
    utilitySetupCost,
    sdltResult,
  ]);

  const totalCost = useMemo(
    () => costs.reduce((sum, c) => sum + c.amount, 0),
    [costs],
  );

  // Top 5 items for donut chart
  const topItems = [...costs].sort((a, b) => b.amount - a.amount).slice(0, 5);

  // Build donut segments from top items
  const donutSegments = useMemo(() => {
    const total = topItems.reduce((s, i) => s + i.amount, 0);
    if (total === 0) return [];
    const r = 70;
    const circumference = 2 * Math.PI * r;
    let cumulativeOffset = 0;
    return topItems.map((item, idx) => {
      const fraction = item.amount / total;
      const dash = fraction * circumference;
      const gap = circumference - dash;
      const offset = -cumulativeOffset;
      cumulativeOffset += dash;
      return { item, dash, gap, offset: circumference / 4 - cumulativeOffset + dash, color: SEGMENT_COLORS[idx] ?? "#ccc", fraction };
    });
  }, [topItems]);

  const BUYER_TYPE_OPTIONS: Array<{ value: BuyerType; label: string }> = [
    { value: "standard", label: "Moving Home" },
    { value: "first_time", label: "First-Time Buyer" },
    { value: "additional", label: "Additional Property" },
  ];

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
      {/* Left Column: Inputs */}
      <div className="space-y-6">
        {/* Purchase Details */}
        <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <CardContent className="p-6">
            <h2 className="font-heading mb-5 flex items-center gap-2 text-base font-bold text-neutral-900 dark:text-white">
              <FileText className="h-4 w-4 text-brand-primary" strokeWidth={1.5} />
              Purchase Details
            </h2>

            <div className="space-y-5">
              {/* Property Price */}
              <div className="space-y-1.5">
                <Label htmlFor="mc-price" className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Property Price
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">
                    £
                  </span>
                  <Input
                    id="mc-price"
                    type="number"
                    min={0}
                    step={1000}
                    value={propertyPrice}
                    onChange={(e) => setPropertyPrice(Number(e.target.value))}
                    className="pl-7 h-10 text-sm border-neutral-200 dark:border-neutral-700 rounded-lg"
                  />
                </div>
              </div>

              {/* Buyer Type */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Buyer Type
                </Label>
                <div className="flex flex-wrap gap-2">
                  {BUYER_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBuyerType(opt.value)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                        buyerType === opt.value
                          ? "border-brand-primary bg-brand-primary text-white"
                          : "border-neutral-200 text-neutral-600 hover:border-brand-primary/40 hover:bg-brand-primary/5 dark:border-neutral-700 dark:text-neutral-400"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loan Amount */}
              <div className="space-y-1.5">
                <Label htmlFor="mc-loan" className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Mortgage Amount{" "}
                  <span className="normal-case font-normal text-neutral-400">(0 = cash)</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">
                    £
                  </span>
                  <Input
                    id="mc-loan"
                    type="number"
                    min={0}
                    step={1000}
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="pl-7 h-10 text-sm border-neutral-200 dark:border-neutral-700 rounded-lg"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-1">
                {[
                  { label: "Leasehold Property", checked: isLeasehold, onChange: setIsLeasehold },
                  { label: "Include Homebuyer Survey", checked: needsSurvey, onChange: setNeedsSurvey },
                  { label: "Remortgage Only", checked: isRemortgage, onChange: setIsRemortgage },
                  { label: "Short-Term Storage", checked: storageNeeded, onChange: setStorageNeeded },
                ].map(({ label, checked, onChange }) => (
                  <div key={label} className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                      {label}
                    </Label>
                    <Switch
                      checked={checked}
                      onCheckedChange={onChange}
                      className="data-[state=checked]:bg-brand-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Estimates — Customise */}
        <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <CardContent className="p-6">
            <h2 className="font-heading mb-4 flex items-center gap-2 text-base font-bold text-neutral-900 dark:text-white">
              <Home className="h-4 w-4 text-brand-primary" strokeWidth={1.5} />
              Cost Estimates
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="mc-removal" className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Removal Company
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">
                    £
                  </span>
                  <Input
                    id="mc-removal"
                    type="number"
                    min={0}
                    step={50}
                    value={removalCost}
                    onChange={(e) => setRemovalCost(Number(e.target.value))}
                    className="pl-7 h-10 text-sm border-neutral-200 dark:border-neutral-700 rounded-lg"
                  />
                </div>
              </div>
              {storageNeeded && (
                <div className="space-y-1.5">
                  <Label htmlFor="mc-storage" className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Storage Cost
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">
                      £
                    </span>
                    <Input
                      id="mc-storage"
                      type="number"
                      min={0}
                      step={50}
                      value={storageCost}
                      onChange={(e) => setStorageCost(Number(e.target.value))}
                      className="pl-7 h-10 text-sm border-neutral-200 dark:border-neutral-700 rounded-lg"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="mc-cleaning" className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Professional Cleaning
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">
                    £
                  </span>
                  <Input
                    id="mc-cleaning"
                    type="number"
                    min={0}
                    step={50}
                    value={cleaningCost}
                    onChange={(e) => setCleaningCost(Number(e.target.value))}
                    className="pl-7 h-10 text-sm border-neutral-200 dark:border-neutral-700 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Results */}
      <div className="space-y-6">
        {/* Dark green results card */}
        <div
          className="rounded-2xl p-6 text-white"
          style={{ backgroundColor: "var(--color-brand-primary)" }}
        >
          {/* Header */}
          <div className="mb-1 text-xs font-semibold uppercase tracking-widest opacity-70">
            Estimated Total
          </div>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="font-heading text-5xl font-black leading-none">
                {formatCurrency(totalCost)}
              </div>
              {propertyPrice > 0 && (
                <div className="mt-1 text-sm opacity-70">
                  {((totalCost / propertyPrice) * 100).toFixed(1)}% of property price
                </div>
              )}
            </div>
            {/* Donut ring */}
            <div className="relative flex-shrink-0 h-24 w-24">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
                {/* Track */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="transparent"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="18"
                />
                {/* Segments */}
                {donutSegments.map((seg, i) => (
                  <circle
                    key={i}
                    cx="80"
                    cy="80"
                    r="70"
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth="18"
                    strokeDasharray={`${seg.dash} ${seg.gap}`}
                    strokeDashoffset={seg.offset}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[9px] font-bold uppercase opacity-70">Total</span>
                <span className="text-xs font-black">{formatCurrency(totalCost)}</span>
              </div>
            </div>
          </div>

          {/* Cost Distribution */}
          <div className="mb-6 border-t border-white/20 pt-5">
            <div className="mb-3 text-xs font-bold uppercase tracking-wide opacity-60">
              Cost Distribution
            </div>
            <div className="space-y-2.5">
              {topItems.map((item, idx) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: SEGMENT_COLORS[idx] ?? "#ccc" }}
                    />
                    <span className="font-medium opacity-90">{item.label}</span>
                  </div>
                  <span className="font-bold tabular-nums">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Download CTA */}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold transition-colors hover:bg-white/20"
          >
            <Download className="h-4 w-4" strokeWidth={1.5} />
            Download PDF Report
          </button>
        </div>

        {/* Full itemised breakdown */}
        <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-heading mb-4 text-sm font-bold text-neutral-900 dark:text-white">
              Full Breakdown
            </h3>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {costs.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {item.label}
                    </p>
                    {item.note && (
                      <p className="text-xs text-neutral-400">{item.note}</p>
                    )}
                  </div>
                  <span className="text-sm font-bold tabular-nums text-neutral-900 dark:text-white">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
            {/* Total row */}
            <div
              className="mt-4 flex items-center justify-between rounded-xl px-4 py-3"
              style={{ backgroundColor: "color-mix(in srgb, var(--color-brand-primary) 8%, transparent)" }}
            >
              <span className="text-sm font-bold text-neutral-900 dark:text-white">Total</span>
              <span
                className="text-xl font-black tabular-nums"
                style={{ color: "var(--color-brand-primary)" }}
              >
                {formatCurrency(totalCost)}
              </span>
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-neutral-400">
              Estimates based on typical UK market rates as of 2025. Legal fees, surveys, and removal
              costs vary — always obtain firm quotes. SDLT rates apply from 1 April 2025.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
