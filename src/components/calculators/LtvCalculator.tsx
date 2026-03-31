"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { FileEdit, ShieldCheck } from "lucide-react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

/**
 * UK LTV rate tiers — lenders typically price in these bands.
 */
const LTV_TIERS: Array<{
  maxLtv: number;
  label: string;
  description: string;
  rateIndicator: string;
  colorClass: string;
}> = [
  {
    maxLtv: 60,
    label: "≤ 60% LTV",
    description: "Best available rates",
    rateIndicator: "Lowest",
    colorClass: "bg-green-500",
  },
  {
    maxLtv: 70,
    label: "61–70% LTV",
    description: "Excellent rates",
    rateIndicator: "Very Low",
    colorClass: "bg-green-400",
  },
  {
    maxLtv: 75,
    label: "71–75% LTV",
    description: "Good rates",
    rateIndicator: "Low",
    colorClass: "bg-lime-400",
  },
  {
    maxLtv: 80,
    label: "76–80% LTV",
    description: "Slightly higher rates",
    rateIndicator: "Moderate",
    colorClass: "bg-yellow-400",
  },
  {
    maxLtv: 85,
    label: "81–85% LTV",
    description: "Higher rates, fewer lenders",
    rateIndicator: "Higher",
    colorClass: "bg-orange-400",
  },
  {
    maxLtv: 90,
    label: "86–90% LTV",
    description: "Limited products",
    rateIndicator: "High",
    colorClass: "bg-orange-500",
  },
  {
    maxLtv: 95,
    label: "91–95% LTV",
    description: "Mortgage Guarantee Scheme eligible",
    rateIndicator: "Very High",
    colorClass: "bg-red-400",
  },
  {
    maxLtv: 100,
    label: "> 95% LTV",
    description: "Very few products available",
    rateIndicator: "Premium",
    colorClass: "bg-red-600",
  },
];

function getTierForLtv(ltv: number) {
  return LTV_TIERS.find((t) => ltv <= t.maxLtv) ?? LTV_TIERS[LTV_TIERS.length - 1];
}

type LtvCalculatorProps = Readonly<{
  initialPrice?: number;
}>;

export function LtvCalculator({ initialPrice }: LtvCalculatorProps = {}) {
  const [propertyPrice, setPropertyPrice] = useState(initialPrice ?? 300000);
  const [deposit, setDeposit] = useState(60000);
  const [targetLtv, setTargetLtv] = useState(75);

  const results = useMemo(() => {
    const loanAmount = Math.max(0, propertyPrice - deposit);
    const ltv = propertyPrice > 0 ? (loanAmount / propertyPrice) * 100 : 0;
    const depositPct = propertyPrice > 0 ? (deposit / propertyPrice) * 100 : 0;

    // Deposit needed to hit target LTV
    const loanAtTarget = (targetLtv / 100) * propertyPrice;
    const depositNeededForTarget = Math.max(0, propertyPrice - loanAtTarget);
    const extraDepositNeeded = Math.max(0, depositNeededForTarget - deposit);

    const tier = getTierForLtv(ltv);

    return {
      loanAmount,
      ltv,
      depositPct,
      depositNeededForTarget,
      extraDepositNeeded,
      tier,
    };
  }, [propertyPrice, deposit, targetLtv]);

  // Gauge arc (180 deg = semicircle)
  const gaugeRadius = 70;
  const gaugeCircumference = Math.PI * gaugeRadius; // half circle
  const gaugeDashOffset = gaugeCircumference * (1 - Math.min(results.ltv, 100) / 100);

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-9">
      {/* Left Column: Inputs */}
      <Card className="lg:col-span-4">
        <CardContent className="p-8">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
            <FileEdit className="h-5 w-5 text-brand-primary" strokeWidth={1.25} />
            Your Details
          </h2>

          <div className="space-y-6">
            {/* Property Price */}
            <div className="space-y-2">
              <Label htmlFor="ltv-price" className="text-sm font-semibold">
                Property Price
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-neutral-400">
                  &pound;
                </span>
                <Input
                  id="ltv-price"
                  type="number"
                  min={0}
                  step={1000}
                  value={propertyPrice}
                  onChange={(e) => setPropertyPrice(Number(e.target.value))}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Deposit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="ltv-deposit" className="text-sm font-semibold">
                  Deposit
                </Label>
                <span className="text-sm font-medium text-neutral-500">
                  {formatPercent(results.depositPct)} of price
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-neutral-400">
                  &pound;
                </span>
                <Input
                  id="ltv-deposit"
                  type="number"
                  min={0}
                  step={1000}
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                  className="pl-8"
                />
              </div>
              <Slider
                min={0}
                max={propertyPrice}
                step={1000}
                value={[deposit]}
                onValueChange={(val) => setDeposit(Array.isArray(val) ? val[0] : val)}
              />
            </div>

            {/* Target LTV */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Target LTV</Label>
                <span className="font-bold text-brand-primary">{targetLtv}%</span>
              </div>
              <Slider
                min={50}
                max={95}
                step={5}
                value={[targetLtv]}
                onValueChange={(val) =>
                  setTargetLtv(Array.isArray(val) ? val[0] : val)
                }
              />
              <div className="flex justify-between text-[10px] font-medium text-neutral-400">
                <span>50%</span>
                <span>75%</span>
                <span>95%</span>
              </div>
            </div>
          </div>

          {/* Target Summary */}
          <div className="mt-8 rounded-xl border border-neutral-200 p-5 dark:border-neutral-700">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-4 w-4 text-brand-primary" strokeWidth={1.25} />
              <p className="text-sm font-bold">To reach {targetLtv}% LTV</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Deposit needed</span>
                <span className="font-semibold">
                  {formatCurrency(results.depositNeededForTarget)}
                </span>
              </div>
              {results.extraDepositNeeded > 0 ? (
                <div className="flex justify-between text-brand-accent dark:text-blue-400">
                  <span>Extra deposit needed</span>
                  <span className="font-bold">
                    +{formatCurrency(results.extraDepositNeeded)}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>You already qualify</span>
                  <span className="font-bold">
                    Current LTV: {formatPercent(results.ltv)}
                  </span>
                </div>
              )}
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
              Your LTV Ratio
            </h2>

            {/* Gauge */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative h-28 w-56">
                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 160 80"
                >
                  {/* Track */}
                  <path
                    d="M 10 80 A 70 70 0 0 1 150 80"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="18"
                    className="text-neutral-100 dark:text-neutral-800"
                    strokeLinecap="round"
                  />
                  {/* Progress */}
                  <path
                    d="M 10 80 A 70 70 0 0 1 150 80"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="18"
                    strokeDasharray={gaugeCircumference}
                    strokeDashoffset={gaugeDashOffset}
                    className={
                      results.ltv <= 60
                        ? "text-green-500"
                        : results.ltv <= 75
                          ? "text-brand-primary"
                          : results.ltv <= 85
                            ? "text-yellow-500"
                            : "text-red-500"
                    }
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                  <span className="text-4xl font-black text-neutral-900 dark:text-white">
                    {formatPercent(results.ltv)}
                  </span>
                </div>
              </div>
            </div>

            {/* Tier Badge */}
            <div className="mb-6 flex items-center gap-3">
              <div className={`h-4 w-4 rounded-full ${results.tier.colorClass}`} />
              <div>
                <p className="text-sm font-bold">{results.tier.label}</p>
                <p className="text-xs text-neutral-500">{results.tier.description}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-6 dark:border-neutral-800">
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-400">Loan Amount</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {formatCurrency(results.loanAmount)}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-400">Deposit</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {formatCurrency(deposit)}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-400">
                  Rate Category
                </p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {results.tier.rateIndicator}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-400">
                  Equity in Property
                </p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {formatCurrency(deposit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LTV Tiers Table */}
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 text-sm font-bold">UK Mortgage Rate Tiers by LTV</h3>
            <div className="space-y-2">
              {LTV_TIERS.map((tier) => {
                const isActive = results.ltv <= tier.maxLtv &&
                  (LTV_TIERS.indexOf(tier) === 0 ||
                    results.ltv > (LTV_TIERS[LTV_TIERS.indexOf(tier) - 1]?.maxLtv ?? 0));
                return (
                  <div
                    key={tier.label}
                    className={`flex items-center justify-between rounded-lg p-3 transition-colors ${
                      isActive
                        ? "bg-brand-primary/5 dark:bg-brand-primary/10"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${tier.colorClass}`} />
                      <span className={`text-sm font-medium ${isActive ? "text-brand-primary" : ""}`}>
                        {tier.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-neutral-500">{tier.description}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
