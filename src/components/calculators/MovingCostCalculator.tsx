"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { FileEdit, Truck } from "lucide-react";
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
        label: "Stamp Duty Land Tax (SDLT)",
        amount: sdltResult.totalTax,
        note: `${(sdltResult.effectiveRate * 100).toFixed(2)}% effective rate`,
      },
      {
        label: "Conveyancing / Legal Fees",
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
        label: "Homebuyer / Building Survey",
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

  // Bar chart data — top 5 cost items
  const sortedForChart = [...costs]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  const maxAmount = sortedForChart[0]?.amount ?? 1;

  const BUYER_TYPE_OPTIONS: Array<{ value: BuyerType; label: string }> = [
    { value: "standard", label: "Moving Home" },
    { value: "first_time", label: "First-Time Buyer" },
    { value: "additional", label: "Additional Property" },
  ];

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-9">
      {/* Left Column: Inputs */}
      <Card className="lg:col-span-4">
        <CardContent className="p-8">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
            <FileEdit className="h-5 w-5 text-brand-primary" strokeWidth={1.25} />
            Purchase Details
          </h2>

          <div className="space-y-6">
            {/* Property Price */}
            <div className="space-y-2">
              <Label htmlFor="mc-price" className="text-sm font-semibold">
                Property Price
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-neutral-400">
                  &pound;
                </span>
                <Input
                  id="mc-price"
                  type="number"
                  min={0}
                  step={1000}
                  value={propertyPrice}
                  onChange={(e) => setPropertyPrice(Number(e.target.value))}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Buyer Type */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Buyer Type</Label>
              <div className="flex flex-wrap gap-2">
                {BUYER_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setBuyerType(opt.value)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      buyerType === opt.value
                        ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Loan Amount */}
            <div className="space-y-2">
              <Label htmlFor="mc-loan" className="text-sm font-semibold">
                Mortgage / Loan Amount{" "}
                <span className="font-normal text-neutral-400">(0 if cash purchase)</span>
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-neutral-400">
                  &pound;
                </span>
                <Input
                  id="mc-loan"
                  type="number"
                  min={0}
                  step={1000}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Leasehold Property</Label>
                <Switch checked={isLeasehold} onCheckedChange={setIsLeasehold} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  Include Homebuyer Survey
                </Label>
                <Switch checked={needsSurvey} onCheckedChange={setNeedsSurvey} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Remortgage Only</Label>
                <Switch checked={isRemortgage} onCheckedChange={setIsRemortgage} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Short-Term Storage</Label>
                <Switch checked={storageNeeded} onCheckedChange={setStorageNeeded} />
              </div>
            </div>

            {/* Editable Costs */}
            <div className="space-y-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
              <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                Customise Estimates
              </p>
              <div className="space-y-2">
                <Label htmlFor="mc-removal" className="text-sm font-semibold">
                  Removal Company
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-neutral-400">
                    &pound;
                  </span>
                  <Input
                    id="mc-removal"
                    type="number"
                    min={0}
                    step={50}
                    value={removalCost}
                    onChange={(e) => setRemovalCost(Number(e.target.value))}
                    className="pl-8"
                  />
                </div>
              </div>
              {storageNeeded && (
                <div className="space-y-2">
                  <Label htmlFor="mc-storage" className="text-sm font-semibold">
                    Storage Cost
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-neutral-400">
                      &pound;
                    </span>
                    <Input
                      id="mc-storage"
                      type="number"
                      min={0}
                      step={50}
                      value={storageCost}
                      onChange={(e) => setStorageCost(Number(e.target.value))}
                      className="pl-8"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="mc-cleaning" className="text-sm font-semibold">
                  Professional Cleaning
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-neutral-400">
                    &pound;
                  </span>
                  <Input
                    id="mc-cleaning"
                    type="number"
                    min={0}
                    step={50}
                    value={cleaningCost}
                    onChange={(e) => setCleaningCost(Number(e.target.value))}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right Column: Results */}
      <div className="space-y-6 lg:col-span-5">
        <Card className="relative overflow-hidden shadow-xl">
          <div className="absolute -mr-16 -mt-16 right-0 top-0 h-32 w-32 rounded-full bg-brand-primary/5" />
          <CardContent className="p-8">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-neutral-400">
              Total Moving Costs
            </h2>
            <div className="mb-8 flex items-baseline gap-2">
              <span className="text-5xl font-black text-neutral-900 dark:text-white">
                {formatCurrency(totalCost)}
              </span>
              <span className="font-medium text-neutral-500">
                {propertyPrice > 0
                  ? `(${((totalCost / propertyPrice) * 100).toFixed(1)}% of price)`
                  : ""}
              </span>
            </div>

            {/* Horizontal Bar Chart */}
            <div className="mb-8 space-y-3 border-t border-neutral-100 pt-8 dark:border-neutral-800">
              <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                Top Cost Items
              </p>
              {sortedForChart.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {item.label}
                    </span>
                    <span className="font-bold tabular-nums">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <div
                      className="h-2 rounded-full bg-brand-primary"
                      style={{ width: `${(item.amount / maxAmount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Full Itemised List */}
            <div className="border-t border-neutral-100 pt-6 dark:border-neutral-800">
              <p className="mb-4 text-xs font-bold uppercase tracking-wide text-neutral-400">
                Full Breakdown
              </p>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {costs.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {item.label}
                      </p>
                      {item.note && (
                        <p className="text-xs text-neutral-400">{item.note}</p>
                      )}
                    </div>
                    <span className="text-sm font-bold tabular-nums">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-brand-primary/5 px-4 py-4 dark:bg-brand-primary/10">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-brand-primary" strokeWidth={1.25} />
                  <span className="text-sm font-bold">Total</span>
                </div>
                <span className="text-xl font-black text-brand-primary">
                  {formatCurrency(totalCost)}
                </span>
              </div>
            </div>

            <p className="mt-6 text-xs text-neutral-400">
              Estimates based on typical UK market rates as of 2025. Legal fees, surveys, and
              removal costs vary — always obtain firm quotes. SDLT rates apply from 1 April 2025.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
