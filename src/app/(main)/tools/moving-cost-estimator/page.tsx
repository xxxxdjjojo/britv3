"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Calculator,
  Truck,
  Info,
  Home,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { calculateSdlt } from "@/lib/calculators/sdlt";
import { calculateLbtt } from "@/lib/calculators/lbtt";
import { calculateLtt } from "@/lib/calculators/ltt";
import type { BuyerType } from "@/types/calculators";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const gbp = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);

// LBTT and LTT calculations imported from @/lib/calculators/

// ---------------------------------------------------------------------------
// Cost ranges
// ---------------------------------------------------------------------------

type CostItem = {
  label: string;
  low: number;
  high: number;
  color: string;
};

function getCostBreakdown(
  propertyPrice: number,
  firstTimeBuyer: boolean,
  location: string,
): { items: CostItem[]; stampDuty: number } {
  // Stamp duty varies by location
  let stampDuty = 0;
  const buyerType: BuyerType = firstTimeBuyer ? "first_time" : "standard";

  switch (location) {
    case "england":
    case "ni":
      stampDuty = calculateSdlt(propertyPrice, buyerType).totalTax;
      break;
    case "scotland":
      stampDuty = calculateLbtt(propertyPrice, firstTimeBuyer).totalTax;
      break;
    case "wales":
      stampDuty = calculateLtt(propertyPrice).totalTax;
      break;
  }

  const items: CostItem[] = [
    {
      label: location === "scotland" ? "LBTT" : location === "wales" ? "LTT" : "Stamp Duty (SDLT)",
      low: stampDuty,
      high: stampDuty,
      color: "bg-brand-primary",
    },
    {
      label: "Solicitor / Conveyancing",
      low: 1200,
      high: 1800,
      color: "bg-brand-primary-dark",
    },
    {
      label: "Survey / Valuation",
      low: 300,
      high: 700,
      color: "bg-brand-gold",
    },
    {
      label: "Removals",
      low: 500,
      high: 1500,
      color: "bg-brand-primary-light",
    },
    {
      label: "EPC Certificate",
      low: 60,
      high: 120,
      color: "bg-brand-primary-lighter",
    },
  ];

  return { items, stampDuty };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MovingCostEstimatorPage() {
  const [propertyPrice, setPropertyPrice] = useState(300000);
  const [firstTimeBuyer, setFirstTimeBuyer] = useState(false);
  const [location, setLocation] = useState("england");

  const handleNumberInput =
    (setter: (v: number) => void, min = 0) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseFloat(e.target.value);
      if (!isNaN(parsed) && parsed >= min) setter(parsed);
      else if (e.target.value === "" || e.target.value === "-") setter(0);
    };

  const { items } = getCostBreakdown(propertyPrice, firstTimeBuyer, location);

  const totalLow = items.reduce((sum, i) => sum + i.low, 0);
  const totalHigh = items.reduce((sum, i) => sum + i.high, 0);
  const totalMid = Math.round((totalLow + totalHigh) / 2);
  const maxHigh = Math.max(...items.map((i) => i.high), 1);

  return (
    <>
      {/* Breadcrumbs */}
      <div className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-neutral-500">
            <Link
              href="/tools"
              className="transition-colors hover:text-brand-primary"
            >
              Tools
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-neutral-900 dark:text-white">
              Moving Cost Estimator
            </span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <header className="border-b border-neutral-200 bg-white py-12 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-4 font-heading text-4xl font-bold text-neutral-900 dark:text-white">
            Moving Cost Estimator
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
            Get a complete breakdown of the costs involved in buying and moving
            into a new home, including stamp duty, legal fees, surveys, and
            removals.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main content */}
          <div className="space-y-8 lg:col-span-8">
            {/* Inputs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Property Details</CardTitle>
                <CardDescription>
                  Enter your property price and location to estimate total moving
                  costs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="property-price">Property Price</Label>
                    <Input
                      id="property-price"
                      type="number"
                      min={0}
                      step={5000}
                      value={propertyPrice}
                      onChange={handleNumberInput(setPropertyPrice)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Property Location</Label>
                    <Select value={location} onValueChange={(value: string | null) => setLocation(value ?? "")}>
                      <SelectTrigger id="location">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="england">England</SelectItem>
                        <SelectItem value="wales">Wales</SelectItem>
                        <SelectItem value="scotland">Scotland</SelectItem>
                        <SelectItem value="ni">Northern Ireland</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={firstTimeBuyer}
                    onCheckedChange={setFirstTimeBuyer}
                    id="ftb-toggle"
                  />
                  <Label htmlFor="ftb-toggle" className="cursor-pointer">
                    I am a first-time buyer
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Cost breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cost Breakdown</CardTitle>
                <CardDescription>
                  Estimated range of costs for a {gbp(propertyPrice)} property
                  in{" "}
                  {location === "ni"
                    ? "Northern Ireland"
                    : location.charAt(0).toUpperCase() + location.slice(1)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {items.map((item) => {
                  const barWidth = (item.high / maxHigh) * 100;
                  return (
                    <div key={item.label}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-900 dark:text-white">
                          {item.label}
                        </span>
                        <span className="text-sm tabular-nums text-neutral-600 dark:text-neutral-400">
                          {item.low === item.high
                            ? gbp(item.low)
                            : `${gbp(item.low)} – ${gbp(item.high)}`}
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div
                          className={`h-full rounded-full ${item.color} transition-all duration-300`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Totals */}
                <div className="mt-6 rounded-xl border border-neutral-200 bg-muted p-5 dark:border-neutral-700 dark:bg-neutral-800/50">
                  <div className="grid gap-4 sm:grid-cols-3 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Low Estimate</p>
                      <p className="text-lg font-bold tabular-nums">
                        {gbp(totalLow)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Mid Estimate
                      </p>
                      <p className="text-2xl font-bold tabular-nums text-brand-primary">
                        {gbp(totalMid)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        High Estimate
                      </p>
                      <p className="text-lg font-bold tabular-nums">
                        {gbp(totalHigh)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What's included */}
            <article className="prose prose-neutral max-w-none dark:prose-invert">
              <h3 className="mb-4 text-xl font-bold">
                What costs are involved in moving?
              </h3>
              <p className="leading-relaxed text-neutral-600 dark:text-neutral-400">
                Buying a home involves more than just the purchase price. Stamp
                duty (or LBTT in Scotland, LTT in Wales) is typically the
                largest additional cost. You will also need to budget for a
                solicitor to handle conveyancing, a property survey, an EPC
                certificate, and removal costs. First-time buyers in England and
                Northern Ireland may benefit from stamp duty relief on
                properties up to &pound;500,000.
              </p>
            </article>

            {/* FAQ */}
            <section className="space-y-4">
              <h3 className="font-heading text-xl font-bold text-neutral-900 dark:text-white">
                Frequently Asked Questions
              </h3>
              {[
                {
                  q: "Do I need a property survey?",
                  a: "While not legally required, a survey is strongly recommended. A basic HomeBuyer Report (Level 2) costs around £300-£500 and can reveal issues that save you thousands. For older or unusual properties, a full Building Survey (Level 3) at £500-£700+ is advisable.",
                },
                {
                  q: "Can I negotiate solicitor fees?",
                  a: "Yes. Many solicitors offer fixed-fee conveyancing packages. It's worth getting 3-4 quotes. Online conveyancers are often cheaper but may offer less personal service. Always check that any quote includes disbursements (search fees, Land Registry fees, etc.).",
                },
                {
                  q: "Are there any costs I'm missing?",
                  a: "This estimator covers the main costs. Other potential expenses include mortgage arrangement fees (£0-£2,000), buildings insurance (required on exchange), redirected mail, new furniture, and utility connection fees.",
                },
              ].map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-neutral-900 dark:text-white">
                    {faq.q}
                  </summary>
                  <p className="px-5 pb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                    {faq.a}
                  </p>
                </details>
              ))}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:col-span-4">
            {/* Solicitor CTA */}
            <div className="rounded-xl bg-brand-primary p-6 text-white shadow-lg">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-white/20 p-2">
                  <Truck className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">Find a Solicitor</h3>
              </div>
              <p className="mb-6 text-sm text-brand-primary-lighter">
                Get a competitive conveyancing quote from our panel of trusted
                solicitors in minutes.
              </p>
              <Link
                href="/marketplace?category=conveyancing"
                className="block w-full rounded-lg bg-white py-3 text-center font-bold text-brand-primary transition-colors hover:bg-muted"
              >
                Get Quotes
              </Link>
              <p className="mt-4 text-center text-[10px] text-brand-primary-lighter">
                Free, no-obligation quote
              </p>
            </div>

            {/* Related tools */}
            <Card>
              <CardContent className="space-y-3 p-5">
                <h3 className="font-bold text-neutral-900 dark:text-white">
                  Related Tools
                </h3>
                <Link
                  href="/tools/stamp-duty-calculator"
                  className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-muted dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  <Home className="h-5 w-5 text-brand-primary" />
                  <div>
                    <p className="text-sm font-semibold">
                      Stamp Duty Calculator
                    </p>
                    <p className="text-xs text-neutral-500">
                      Detailed SDLT band breakdown
                    </p>
                  </div>
                </Link>
                <Link
                  href="/tools/mortgage-calculator"
                  className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-muted dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  <Calculator className="h-5 w-5 text-brand-primary" />
                  <div>
                    <p className="text-sm font-semibold">
                      Mortgage Calculator
                    </p>
                    <p className="text-xs text-neutral-500">
                      Estimate monthly repayments
                    </p>
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <div className="rounded-xl border border-dashed border-neutral-300 bg-muted/50 p-5 dark:border-neutral-700 dark:bg-neutral-900/30">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
                <p className="text-[11px] italic leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Disclaimer: Costs shown are estimated ranges based on typical
                  UK market data. Actual costs may vary. Tax rates are subject to
                  change. Always seek professional advice.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
