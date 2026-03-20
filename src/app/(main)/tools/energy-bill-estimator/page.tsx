"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Home,
  Building2,
  Hotel,
  Castle,
  Lightbulb,
  TrendingDown,
  BarChart3,
  ArrowRight,
  Droplets,
  Monitor,
  DoorOpen,
  Zap,
  ChevronRight,
  Wrench,
  Calculator,
  PoundSterling,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

const PROPERTY_TYPES = [
  { value: "flat", label: "Flat", icon: Building2 },
  { value: "terraced", label: "Terraced", icon: Home },
  { value: "semi", label: "Semi", icon: Hotel },
  { value: "detached", label: "Detached", icon: Castle },
] as const;

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5] as const;

const EPC_RATINGS = ["A", "B", "C", "D", "E", "F", "G"] as const;

const HEATING_TYPES = [
  { value: "gas", label: "Gas Central Heating" },
  { value: "electric", label: "Electric Storage Heaters" },
  { value: "heatPump", label: "Air Source Heat Pump" },
  { value: "oil", label: "Oil Heating" },
] as const;

const BASE_COSTS: Record<string, number> = {
  "flat-1": 65, "flat-2": 85, "flat-3": 110,
  "flat-4": 130, "flat-5": 150,
  "terraced-1": 80, "terraced-2": 95, "terraced-3": 120,
  "terraced-4": 150, "terraced-5": 175,
  "semi-1": 90, "semi-2": 105, "semi-3": 135,
  "semi-4": 165, "semi-5": 195,
  "detached-1": 110, "detached-2": 130, "detached-3": 155,
  "detached-4": 185, "detached-5": 220,
};

const EPC_MULTIPLIER: Record<string, number> = {
  A: 0.6, B: 0.75, C: 0.9, D: 1.0, E: 1.15, F: 1.35, G: 1.6,
};

const HEATING_MULTIPLIER: Record<string, number> = {
  gas: 1.0, electric: 1.25, oil: 1.15, heatPump: 0.7,
};

const EPC_COLORS: Record<string, string> = {
  A: "bg-[#008050]",
  B: "bg-[#19b459]",
  C: "bg-[#8cc63f]",
  D: "bg-[#fff200]",
  E: "bg-[#f7941d]",
  F: "bg-[#ed1c24]",
  G: "bg-[#be1e2d]",
};

const EPC_BAR_WIDTHS: Record<string, string> = {
  A: "w-full",
  B: "w-5/6",
  C: "w-4/6",
  D: "w-3/6",
  E: "w-2/6",
  F: "w-1/4",
  G: "w-1/6",
};

const AREA_AVERAGE = 145;

const FAQ_ITEMS = [
  {
    q: "How accurate is this estimate?",
    a: "Our estimates are based on average UK energy consumption data from Ofgem and typical tariff rates. Actual costs will vary depending on your energy supplier, usage habits, insulation quality, and local weather patterns.",
  },
  {
    q: "What is an EPC rating?",
    a: "An Energy Performance Certificate (EPC) rates a property's energy efficiency from A (most efficient) to G (least efficient). It's required when selling or renting a property in the UK and is valid for 10 years.",
  },
  {
    q: "How can I improve my EPC rating?",
    a: "Common improvements include adding loft or cavity wall insulation, upgrading to double glazing, installing a more efficient boiler, switching to LED lighting, and considering renewable energy sources like solar panels or heat pumps.",
  },
  {
    q: "Do I need a professional EPC assessment?",
    a: "Yes, only accredited Domestic Energy Assessors can produce a valid EPC. Our tool provides an estimate, but for an official rating you'll need a qualified assessor to visit your property.",
  },
];

function getPotentialRating(current: string): string | null {
  const idx = EPC_RATINGS.indexOf(current as typeof EPC_RATINGS[number]);
  if (idx > 0) return EPC_RATINGS[idx - 1];
  return null;
}

export default function EnergyBillEstimatorPage() {
  const [propertyType, setPropertyType] = useState("flat");
  const [bedrooms, setBedrooms] = useState(1);
  const [epcRating, setEpcRating] = useState("C");
  const [heatingType, setHeatingType] = useState("gas");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const estimate = useMemo(() => {
    const key = `${propertyType}-${bedrooms}`;
    const baseCost = BASE_COSTS[key] ?? 120;
    const epcMul = EPC_MULTIPLIER[epcRating] ?? 1.0;
    const heatMul = HEATING_MULTIPLIER[heatingType] ?? 1.0;
    const monthly = Math.round(baseCost * epcMul * heatMul);
    const annual = monthly * 12;
    const diff = monthly - AREA_AVERAGE;
    const diffPct = Math.abs(Math.round((diff / AREA_AVERAGE) * 100));

    const potentialRating = getPotentialRating(epcRating);
    const potentialMul = potentialRating ? (EPC_MULTIPLIER[potentialRating] ?? 1.0) : epcMul;
    const potentialMonthly = Math.round(baseCost * potentialMul * heatMul);
    const annualSaving = (monthly - potentialMonthly) * 12;

    return { monthly, annual, diff, diffPct, potentialRating, annualSaving };
  }, [propertyType, bedrooms, epcRating, heatingType]);

  const comparisonPct = Math.min(100, Math.round((estimate.monthly / (AREA_AVERAGE * 2)) * 100));

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-8">
        <Link href="/tools" className="hover:text-brand-primary transition-colors">
          Tools
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-neutral-900 dark:text-neutral-100 font-medium">
          Energy Bill Estimator
        </span>
      </nav>

      {/* Hero Section */}
      <header className="mb-12 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-extrabold text-neutral-900 dark:text-white mb-4 font-heading">
          Energy Bill &amp; EPC Estimator
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl">
          Get an instant breakdown of your estimated monthly energy costs and
          learn how to optimise your home&apos;s EPC rating for maximum efficiency.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Inputs & Results */}
        <div className="lg:col-span-8 space-y-8">
          {/* Input Card */}
          <Card className="p-0">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <Home className="size-5" />
                </div>
                <h2 className="text-xl font-bold font-heading">Property Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Property Type */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Property Type
                  </label>
                  <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Property type">
                    {PROPERTY_TYPES.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={propertyType === value}
                        onClick={() => setPropertyType(value)}
                        className={`px-4 py-3 rounded-lg border-2 text-sm flex items-center justify-center gap-2 transition-colors ${
                          propertyType === value
                            ? "border-brand-primary bg-brand-primary/5 text-brand-primary font-medium"
                            : "border-neutral-200 dark:border-neutral-700 hover:border-brand-primary/50"
                        }`}
                      >
                        <Icon className="size-4" /> {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bedrooms */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Number of Bedrooms
                  </label>
                  <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg" role="radiogroup" aria-label="Number of bedrooms">
                    {BEDROOM_OPTIONS.map((num) => (
                      <button
                        key={num}
                        type="button"
                        role="radio"
                        aria-checked={bedrooms === num}
                        onClick={() => setBedrooms(num)}
                        className={`flex-1 py-2 rounded-md text-sm transition-colors ${
                          bedrooms === num
                            ? "bg-white dark:bg-neutral-700 shadow-sm font-bold"
                            : "hover:bg-white/50 dark:hover:bg-neutral-700/50"
                        }`}
                      >
                        {num === 5 ? "5+" : num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Heating Type */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Primary Heating Source
                  </label>
                  <select
                    value={heatingType}
                    onChange={(e) => setHeatingType(e.target.value)}
                    className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-lg focus:ring-2 focus:ring-brand-primary py-3 px-4"
                  >
                    {HEATING_TYPES.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* EPC Selector */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Current EPC Rating
                  </label>
                  <div className="flex justify-between gap-1 h-10" role="radiogroup" aria-label="EPC rating">
                    {EPC_RATINGS.map((rating, idx) => (
                      <button
                        key={rating}
                        type="button"
                        role="radio"
                        aria-checked={epcRating === rating}
                        onClick={() => setEpcRating(rating)}
                        className={`flex-1 ${EPC_COLORS[rating]} transition-opacity flex items-center justify-center text-xs font-bold ${
                          rating === "D" ? "text-neutral-900" : "text-white"
                        } ${idx === 0 ? "rounded-l" : ""} ${idx === 6 ? "rounded-r" : ""} ${
                          epcRating === rating
                            ? "opacity-100 ring-2 ring-offset-2 ring-neutral-900 dark:ring-white"
                            : "opacity-30 hover:opacity-100"
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Dashboard */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main Result */}
            <div className="bg-neutral-900 text-white rounded-xl p-8 flex flex-col justify-between overflow-hidden relative">
              <div className="relative z-10">
                <span className="text-brand-primary font-bold text-sm tracking-widest uppercase mb-2 block">
                  Estimated Monthly Bill
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black">&pound;{estimate.monthly}</span>
                  <span className="text-neutral-400 font-medium">/month</span>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-neutral-800 relative z-10">
                <div
                  className={`flex items-center gap-2 text-sm font-medium ${
                    estimate.diff <= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  <TrendingDown className="size-4" />
                  {estimate.diff <= 0
                    ? `${estimate.diffPct}% lower than area average`
                    : `${estimate.diffPct}% higher than area average`}
                </div>
                <p className="text-neutral-400 text-xs mt-1">
                  Based on current rates for a {bedrooms}-bed{" "}
                  {PROPERTY_TYPES.find((t) => t.value === propertyType)?.label?.toLowerCase()}.
                </p>
              </div>
              {/* Abstract design element */}
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-brand-primary/20 rounded-full blur-3xl" />
            </div>

            {/* Comparison Meter */}
            <Card className="p-0">
              <CardContent className="p-8">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2 font-heading">
                  <BarChart3 className="size-5 text-brand-primary" />
                  Area Comparison
                </h3>
                <div className="space-y-6">
                  <div className="relative h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-brand-primary rounded-full transition-all duration-500"
                      style={{ width: `${comparisonPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    <span>Efficient</span>
                    <span>Average</span>
                    <span>Expensive</span>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Your property performs{" "}
                    {estimate.diff <= 0 ? "better" : "worse"} than{" "}
                    <span className="text-neutral-900 dark:text-white font-bold">
                      {estimate.diff <= 0
                        ? `${Math.min(99, 50 + estimate.diffPct)}%`
                        : `${Math.max(1, 50 - estimate.diffPct)}%`}{" "}
                      of similar homes
                    </span>{" "}
                    in your area.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* EPC Visualiser */}
          <Card className="p-0">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h3 className="font-bold text-xl font-heading">Energy Efficiency Progress</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                    <span className="text-xs font-medium">Current ({epcRating})</span>
                  </div>
                  {estimate.potentialRating && (
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-brand-primary" />
                      <span className="text-xs font-medium">Potential ({estimate.potentialRating})</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {EPC_RATINGS.map((rating) => {
                  const isCurrent = rating === epcRating;
                  const isPotential = rating === estimate.potentialRating;
                  const currentIdx = EPC_RATINGS.indexOf(epcRating as typeof EPC_RATINGS[number]);
                  const ratingIdx = EPC_RATINGS.indexOf(rating);
                  const isInactive = !isCurrent && !isPotential;

                  return (
                    <div key={rating} className={`relative ${isInactive && ratingIdx > currentIdx ? "opacity-30" : ""}`}>
                      <div className="flex items-center gap-4">
                        <span className="w-6 font-bold text-neutral-400">{rating}</span>
                        <div className="flex-1 h-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden relative">
                          <div
                            className={`h-full ${EPC_COLORS[rating]} ${EPC_BAR_WIDTHS[rating]} ${
                              isCurrent ? "shadow-md border-r-4 border-neutral-900/20" : ""
                            } ${isPotential ? "shadow-lg" : ""} ${isInactive && ratingIdx < currentIdx ? "opacity-20" : ""}`}
                          >
                            {isCurrent && (
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-white font-bold uppercase">
                                Current Rating
                              </span>
                            )}
                            {isPotential && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white font-bold uppercase">
                                Potential
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {estimate.potentialRating && estimate.annualSaving > 0 && (
                <div className="mt-8 p-4 bg-brand-primary/5 rounded-lg border border-brand-primary/20 flex items-start gap-4">
                  <Lightbulb className="size-5 text-brand-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">
                    Improving your rating from{" "}
                    <span className="font-bold">{epcRating} to {estimate.potentialRating}</span>{" "}
                    could save you approximately{" "}
                    <span className="font-bold text-neutral-900 dark:text-white">
                      &pound;{estimate.annualSaving} per year
                    </span>{" "}
                    on your energy bills.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card className="p-0">
            <CardContent className="p-6 md:p-8">
              <h3 className="font-bold text-xl mb-6 font-heading">Frequently Asked Questions</h3>
              <div className="space-y-2">
                {FAQ_ITEMS.map((item, idx) => (
                  <div
                    key={idx}
                    className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full flex items-center justify-between p-4 text-left text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      {item.q}
                      <ChevronRight
                        className={`size-4 shrink-0 transition-transform ${
                          openFaq === idx ? "rotate-90" : ""
                        }`}
                      />
                    </button>
                    {openFaq === idx && (
                      <div className="px-4 pb-4 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Sidebar (sticky) */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 lg:self-start">
          {/* CTA Card */}
          <div className="bg-brand-primary rounded-xl p-8 text-white shadow-lg shadow-brand-primary/20 overflow-hidden relative group">
            <div className="relative z-10">
              <h3 className="text-2xl font-extrabold mb-3 leading-tight font-heading">
                Need a professional assessment?
              </h3>
              <p className="text-white/80 text-sm mb-8">
                Get a certified EPC assessor to visit your property and provide
                an official rating.
              </p>
              <Button asChild variant="secondary" className="w-full py-4 bg-white text-brand-primary font-bold rounded-lg hover:bg-neutral-100">
                <Link href="/services?category=energy">Find an Assessor <ArrowRight className="size-4 inline" /></Link>
              </Button>
            </div>
            <Zap className="absolute -bottom-10 -right-10 size-44 text-white/10 group-hover:scale-110 transition-transform duration-500" />
          </div>

          {/* Tips Section */}
          <Card className="p-0">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-6 font-heading">Energy Saving Tips</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center">
                    <Monitor className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold mb-1">Install Smart Meter</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Track usage in real-time to identify high-cost habits instantly.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                    <Droplets className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold mb-1">Bleed Your Radiators</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Improve efficiency by removing trapped air from your heating system.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 flex items-center justify-center">
                    <Lightbulb className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold mb-1">Switch to LED Bulbs</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Save up to &pound;55 a year by swapping old bulbs for energy-efficient LEDs.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
                    <DoorOpen className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold mb-1">Draft Proofing</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Simple seals around doors and windows keep the warmth inside.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Tools */}
          <Card className="p-0">
            <CardContent className="p-6">
              <h3 className="font-bold text-sm uppercase tracking-wider text-neutral-400 mb-4 font-heading">
                Related Tools
              </h3>
              <div className="space-y-3">
                <Link
                  href="/tools/mortgage-calculator"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                    <Calculator className="size-4" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold block group-hover:text-brand-primary transition-colors">
                      Mortgage Calculator
                    </span>
                    <span className="text-xs text-neutral-500">Estimate monthly repayments</span>
                  </div>
                  <ChevronRight className="size-4 text-neutral-400" />
                </Link>
                <Link
                  href="/tools/stamp-duty-calculator"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                    <PoundSterling className="size-4" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold block group-hover:text-brand-primary transition-colors">
                      Stamp Duty Calculator
                    </span>
                    <span className="text-xs text-neutral-500">Calculate SDLT costs</span>
                  </div>
                  <ChevronRight className="size-4 text-neutral-400" />
                </Link>
                <Link
                  href="/services?category=energy"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                    <Wrench className="size-4" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold block group-hover:text-brand-primary transition-colors">
                      Find Energy Assessors
                    </span>
                    <span className="text-xs text-neutral-500">Browse local professionals</span>
                  </div>
                  <ChevronRight className="size-4 text-neutral-400" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50 p-5 dark:border-neutral-700 dark:bg-neutral-900/30">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
              <p className="text-[11px] italic leading-relaxed text-neutral-500 dark:text-neutral-400">
                Disclaimer: Energy cost estimates are based on average UK
                consumption data and Ofgem price cap rates. Actual costs vary
                by provider, tariff, and usage. This tool is for informational
                purposes only and does not constitute financial advice.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
