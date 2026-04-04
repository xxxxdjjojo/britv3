"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Home,
  Building2,
  Hotel,
  Castle,
  Lightbulb,
  TrendingDown,
  ArrowRight,
  Droplets,
  Monitor,
  DoorOpen,
  Zap,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Wrench,
  Calculator,
  PoundSterling,
  Leaf,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PROPERTY_TYPES = [
  { value: "flat", label: "Flat", icon: Building2 },
  { value: "terraced", label: "Terraced", icon: Home },
  { value: "semi", label: "Semi", icon: Hotel },
  { value: "detached", label: "Detached", icon: Castle },
] as const;

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5] as const;

const OCCUPANT_OPTIONS = [1, 2, 3, 4, 5] as const;

const OCCUPANCY_MULTIPLIER: Record<number, number> = {
  1: 0.75,
  2: 1.0,
  3: 1.15,
  4: 1.25,
  5: 1.4,
};

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

const ENERGY_SPLIT: Record<string, { elec: number; other: number; otherLabel: string }> = {
  gas:      { elec: 0.40, other: 0.60, otherLabel: "Gas" },
  electric: { elec: 1.00, other: 0.00, otherLabel: "Gas" },
  heatPump: { elec: 0.95, other: 0.05, otherLabel: "Gas" },
  oil:      { elec: 0.30, other: 0.70, otherLabel: "Oil" },
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
  const idx = EPC_RATINGS.indexOf(current as (typeof EPC_RATINGS)[number]);
  if (idx > 0) return EPC_RATINGS[idx - 1];
  return null;
}

function getUrlStr(key: string, defaultValue: string, allowed?: string[]): string {
  if (typeof window === "undefined") return defaultValue;
  const params = new URLSearchParams(window.location.search);
  const val = params.get(key);
  if (val === null) return defaultValue;
  if (allowed && !allowed.includes(val)) return defaultValue;
  return val;
}

function getUrlNum(key: string, defaultValue: number): number {
  if (typeof window === "undefined") return defaultValue;
  const params = new URLSearchParams(window.location.search);
  const val = params.get(key);
  return val !== null && !isNaN(Number(val)) ? Number(val) : defaultValue;
}

export default function EnergyBillEstimatorPage() {
  const [propertyType, setPropertyType] = useState(() =>
    getUrlStr("type", "flat", ["flat", "terraced", "semi", "detached"])
  );
  const [bedrooms, setBedrooms] = useState(() => getUrlNum("beds", 1));
  const [occupants, setOccupants] = useState(2);
  const [epcRating, setEpcRating] = useState(() =>
    getUrlStr("epc", "C", ["A", "B", "C", "D", "E", "F", "G"])
  );
  const [heatingType, setHeatingType] = useState(() =>
    getUrlStr("heating", "gas", ["gas", "electric", "heatPump", "oil"])
  );
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Sync key state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (propertyType !== "flat") params.set("type", propertyType);
    if (bedrooms !== 1) params.set("beds", String(bedrooms));
    if (epcRating !== "C") params.set("epc", epcRating);
    if (heatingType !== "gas") params.set("heating", heatingType);
    const url = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, "", url);
  }, [propertyType, bedrooms, epcRating, heatingType]);

  const estimate = useMemo(() => {
    const key = `${propertyType}-${bedrooms}`;
    const baseCost = BASE_COSTS[key] ?? 120;
    const epcMul = EPC_MULTIPLIER[epcRating] ?? 1.0;
    const heatMul = HEATING_MULTIPLIER[heatingType] ?? 1.0;
    const occMul = OCCUPANCY_MULTIPLIER[occupants] ?? 1.0;
    const monthly = Math.round(baseCost * epcMul * heatMul * occMul);
    const annual = monthly * 12;
    const diff = monthly - AREA_AVERAGE;
    const diffPct = Math.abs(Math.round((diff / AREA_AVERAGE) * 100));

    const potentialRating = getPotentialRating(epcRating);
    const potentialMul = potentialRating ? (EPC_MULTIPLIER[potentialRating] ?? 1.0) : epcMul;
    const potentialMonthly = Math.round(baseCost * potentialMul * heatMul * occMul);
    const annualSaving = (monthly - potentialMonthly) * 12;

    const split = ENERGY_SPLIT[heatingType] ?? ENERGY_SPLIT.gas;
    const elecMonthly = Math.round(monthly * split.elec);
    const otherMonthly = Math.round(monthly * split.other);
    const otherLabel = split.otherLabel;

    return { monthly, annual, diff, diffPct, potentialRating, annualSaving, elecMonthly, otherMonthly, otherLabel };
  }, [propertyType, bedrooms, occupants, epcRating, heatingType]);

  const comparisonPct = Math.min(100, Math.round((estimate.monthly / (AREA_AVERAGE * 2)) * 100));

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <header className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8 py-12 lg:py-16 items-start lg:items-center">
            {/* Left copy */}
            <div className="flex-1">
              <nav className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-6">
                <Link href="/tools" className="hover:text-brand-primary transition-colors">
                  Tools
                </Link>
                <ChevronRight className="size-3" />
                <span className="text-neutral-600 dark:text-neutral-300">Energy Bill Estimator</span>
              </nav>

              <h1 className="text-5xl md:text-6xl font-bold font-heading text-neutral-900 dark:text-white leading-tight mb-5">
                Estimate Your Monthly{" "}
                <em className="not-italic text-brand-primary">Energy Costs</em>
              </h1>
              <p className="text-base text-neutral-500 max-w-lg leading-relaxed">
                A live estimate of your property&apos;s energy bills, powered by Ofgem data,
                your EPC rating, and property type — so you can identify savings before
                you discover them on an invoice.
              </p>
            </div>

            {/* Right: decorative property image placeholder */}
            <div className="hidden lg:block w-96 h-60 rounded-2xl overflow-hidden shrink-0 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-primary-light to-neutral-900" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8">
                <div className="w-full h-32 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <div className="grid grid-cols-4 gap-2">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="w-5 h-6 bg-white/20 rounded-sm" />
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">
                    property profile
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ─── Left Column ───────────────────────────────────────────────── */}
          <div className="lg:col-span-7 space-y-8">

            {/* Property Profile Form */}
            <Card className="p-0 border-neutral-200 dark:border-neutral-800 shadow-sm">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-7">
                  <Home className="size-5 text-brand-primary" />
                  <h2 className="text-xl font-bold font-heading">Property Profile</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Property Type */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      Property Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {PROPERTY_TYPES.map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setPropertyType(value)}
                          className={`px-3 py-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                            propertyType === value
                              ? "border-brand-primary bg-brand-primary-lighter text-brand-primary"
                              : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-brand-primary/40"
                          }`}
                        >
                          <Icon className="size-3.5 shrink-0" /> {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bedrooms */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      Bedrooms
                    </label>
                    <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
                      {BEDROOM_OPTIONS.map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setBedrooms(num)}
                          className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${
                            bedrooms === num
                              ? "bg-white dark:bg-neutral-700 shadow-sm text-brand-primary"
                              : "text-neutral-500 hover:bg-white/50 dark:hover:bg-neutral-700/50"
                          }`}
                        >
                          {num === 5 ? "5+" : num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Heating Type */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      Heating Source
                    </label>
                    <select
                      value={heatingType}
                      onChange={(e) => setHeatingType(e.target.value)}
                      className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-lg text-sm py-2.5 px-3 focus:ring-2 focus:ring-brand-primary text-neutral-700 dark:text-neutral-300"
                    >
                      {HEATING_TYPES.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Occupants */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      Occupants
                    </label>
                    <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
                      {OCCUPANT_OPTIONS.map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setOccupants(num)}
                          className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${
                            occupants === num
                              ? "bg-white dark:bg-neutral-700 shadow-sm text-brand-primary"
                              : "text-neutral-500 hover:bg-white/50 dark:hover:bg-neutral-700/50"
                          }`}
                        >
                          {num === 5 ? "5+" : num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* EPC Selector */}
                  <div className="space-y-3 sm:col-span-2">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      Current EPC Rating
                    </label>
                    <div className="flex justify-between gap-1 h-10">
                      {EPC_RATINGS.map((rating, idx) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setEpcRating(rating)}
                          className={`flex-1 ${EPC_COLORS[rating]} transition-opacity flex items-center justify-center text-xs font-bold ${
                            rating === "D" ? "text-neutral-900" : "text-white"
                          } ${idx === 0 ? "rounded-l-lg" : ""} ${idx === 6 ? "rounded-r-lg" : ""} ${
                            epcRating === rating
                              ? "opacity-100 ring-2 ring-offset-2 ring-neutral-900 dark:ring-white"
                              : "opacity-30 hover:opacity-80"
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

            {/* Immediate Reductions + Long-term Value */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Immediate Reductions */}
              <div className="bg-brand-primary rounded-xl p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="size-4" />
                  <h3 className="text-sm font-bold uppercase tracking-widest">Immediate Reductions</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Zap className="size-3.5 text-white/60 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">LED Lighting Swap</p>
                      <p className="text-[10px] text-white/60">Save up to £55/year</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <DoorOpen className="size-3.5 text-white/60 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">Draft Proofing</p>
                      <p className="text-[10px] text-white/60">Seal doors & windows</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Monitor className="size-3.5 text-white/60 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">Smart Meter Install</p>
                      <p className="text-[10px] text-white/60">Real-time usage visibility</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Long-term Value */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Leaf className="size-4 text-brand-primary" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
                    Long-term Value
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Star className="size-3.5 text-brand-secondary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-neutral-800 dark:text-white">Heat Pump Upgrade</p>
                      <p className="text-[10px] text-neutral-500">30% efficiency gain</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Star className="size-3.5 text-brand-secondary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-neutral-800 dark:text-white">Cavity Wall Insulation</p>
                      <p className="text-[10px] text-neutral-500">Up to £250 annual saving</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Star className="size-3.5 text-brand-secondary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-neutral-800 dark:text-white">Solar Panels</p>
                      <p className="text-[10px] text-neutral-500">Reduces grid dependence</p>
                    </div>
                  </div>
                </div>
                {estimate.potentialRating && estimate.annualSaving > 0 && (
                  <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    <p className="text-[10px] text-neutral-500">
                      EPC {epcRating} → {estimate.potentialRating} could save
                    </p>
                    <p className="text-lg font-bold text-brand-primary font-heading">
                      £{estimate.annualSaving}/yr
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* The EPC Standard */}
            <Card className="p-0 border-neutral-200 dark:border-neutral-800 shadow-sm">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                  <div>
                    <h3 className="text-xl font-bold font-heading mb-1">The EPC Standard</h3>
                    <p className="text-sm text-neutral-500">
                      The A–G scale measures a home&apos;s energy efficiency from most to least efficient.
                    </p>
                  </div>
                  {estimate.potentialRating && (
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-neutral-400 font-medium">Current ({epcRating})</span>
                      <span className="w-4 h-px bg-neutral-300" />
                      <span className="text-xs text-brand-primary font-bold">Potential ({estimate.potentialRating})</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {EPC_RATINGS.map((rating) => {
                    const isCurrent = rating === epcRating;
                    const isPotential = rating === estimate.potentialRating;
                    const currentIdx = EPC_RATINGS.indexOf(epcRating as (typeof EPC_RATINGS)[number]);
                    const ratingIdx = EPC_RATINGS.indexOf(rating);
                    const isInactive = !isCurrent && !isPotential;

                    return (
                      <div key={rating} className={`relative ${isInactive && ratingIdx > currentIdx ? "opacity-30" : ""}`}>
                        <div className="flex items-center gap-3">
                          <span className={`w-5 text-xs font-bold ${isCurrent ? "text-neutral-900 dark:text-white" : "text-neutral-400"}`}>
                            {rating}
                          </span>
                          <div className="flex-1 h-7 bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden relative">
                            <div
                              className={`h-full ${EPC_COLORS[rating]} ${EPC_BAR_WIDTHS[rating]} ${
                                isCurrent ? "shadow-md border-r-4 border-neutral-900/20" : ""
                              } ${isPotential ? "shadow-lg" : ""} ${isInactive && ratingIdx < currentIdx ? "opacity-20" : ""}`}
                            >
                              {isCurrent && (
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] text-white font-bold uppercase tracking-wide">
                                  Current
                                </span>
                              )}
                              {isPotential && (
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-white font-bold uppercase tracking-wide">
                                  Target
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
                  <div className="mt-6 p-4 bg-brand-primary-lighter dark:bg-brand-primary/10 rounded-xl border border-brand-primary/20 flex items-start gap-3">
                    <Lightbulb className="size-4 text-brand-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">
                      Improving your rating from{" "}
                      <span className="font-bold">{epcRating}</span> to{" "}
                      <span className="font-bold text-brand-primary">{estimate.potentialRating}</span>{" "}
                      could save approximately{" "}
                      <span className="font-bold text-neutral-900 dark:text-white">
                        £{estimate.annualSaving} per year
                      </span>{" "}
                      on your energy bills.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Green Home Excellence info card */}
            <div className="bg-brand-primary-lighter dark:bg-brand-primary/10 rounded-xl p-6 border border-brand-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Leaf className="size-4 text-brand-primary" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-brand-primary">
                  Green Home Excellence
                </h3>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                Properties rated A or B command a green premium — typically selling for 2–5% more
                than equivalent D-rated homes. Upgrading your EPC is an investment that pays in
                both energy savings and property value.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "A-B rated homes sell for", stat: "+4.2%" },
                  { label: "Avg. annual saving vs D rating", stat: "£380" },
                  { label: "EPC upgrade ROI payback", stat: "5–8 yr" },
                ].map(({ label, stat }) => (
                  <div key={label} className="bg-white dark:bg-neutral-900 rounded-lg p-3 border border-brand-primary/10">
                    <p className="text-[10px] text-neutral-500 leading-tight mb-1">{label}</p>
                    <p className="text-lg font-bold text-brand-primary font-heading">{stat}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <Card className="p-0 border-neutral-200 dark:border-neutral-800 shadow-sm">
              <CardContent className="p-6 md:p-8">
                <h3 className="font-bold text-xl mb-6 font-heading">Frequently Asked Questions</h3>
                <div className="space-y-0 divide-y divide-neutral-100 dark:divide-neutral-800">
                  {FAQ_ITEMS.map((item, idx) => (
                    <div key={idx} className="py-4 first:pt-0 last:pb-0">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        className="w-full flex items-center justify-between text-left gap-4"
                      >
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                          {item.q}
                        </span>
                        {openFaq === idx ? (
                          <ChevronUp className="size-4 text-neutral-400 shrink-0" />
                        ) : (
                          <ChevronDown className="size-4 text-neutral-400 shrink-0" />
                        )}
                      </button>
                      {openFaq === idx && (
                        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          {item.a}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── Right Column ──────────────────────────────────────────────── */}
          <aside className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 lg:self-start">

            {/* Estimated Monthly Cost Card */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
              <div className="p-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">
                  Estimated Monthly Cost
                </p>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold font-heading text-neutral-900 dark:text-white">
                        £{estimate.monthly}.00
                      </span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 mt-2 text-xs font-semibold ${
                        estimate.diff <= 0 ? "text-brand-primary" : "text-error"
                      }`}
                    >
                      <TrendingDown className="size-3.5" />
                      {estimate.diff <= 0
                        ? `${estimate.diffPct}% below area average`
                        : `${estimate.diffPct}% above area average`}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-neutral-400">Annual total</p>
                    <p className="text-xl font-bold font-heading text-neutral-900 dark:text-white">
                      £{estimate.annual.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cost breakdown bars */}
              <div className="p-6 space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                  Cost Split
                </p>

                <div className="space-y-3">
                  {/* Electricity */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300">Electricity</span>
                      <span className="font-bold text-neutral-900 dark:text-white">£{estimate.elecMonthly}/mo</span>
                    </div>
                    <div className="h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-secondary rounded-full transition-all duration-500"
                        style={{
                          width: `${estimate.monthly > 0 ? Math.round((estimate.elecMonthly / estimate.monthly) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Gas / Oil */}
                  {estimate.otherMonthly > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                          {estimate.otherLabel}
                        </span>
                        <span className="font-bold text-neutral-900 dark:text-white">£{estimate.otherMonthly}/mo</span>
                      </div>
                      <div className="h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-primary rounded-full transition-all duration-500"
                          style={{
                            width: `${estimate.monthly > 0 ? Math.round((estimate.otherMonthly / estimate.monthly) * 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Area comparison meter */}
                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    <span>Efficient</span>
                    <span>Average</span>
                    <span>Costly</span>
                  </div>
                  <div className="relative h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-brand-primary rounded-full transition-all duration-500"
                      style={{ width: `${comparisonPct}%` }}
                    />
                    {/* Average marker */}
                    <div className="absolute inset-y-0 left-1/2 w-px bg-neutral-400/60" />
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Your home performs{" "}
                    <span className="font-bold text-neutral-700 dark:text-neutral-300">
                      {estimate.diff <= 0 ? "better" : "worse"}
                    </span>{" "}
                    than{" "}
                    {estimate.diff <= 0
                      ? `${Math.min(99, 50 + estimate.diffPct)}%`
                      : `${Math.max(1, 50 - estimate.diffPct)}%`}{" "}
                    of similar properties.
                  </p>
                </div>
              </div>

              <p className="px-6 pb-4 text-[10px] text-neutral-400 italic">
                Based on Ofgem price cap rates Jan 2025. Reviewed quarterly.
              </p>
            </div>

            {/* Expert Consultation CTA */}
            <div className="bg-brand-primary rounded-xl p-6 text-white overflow-hidden relative">
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2 font-heading">Expert Consultation</h3>
                <p className="text-sm text-white/70 mb-5 leading-relaxed">
                  From accredited assessors to retrofit specialists — find qualified energy
                  professionals serving your area.
                </p>
                <Button
                  asChild
                  className="w-full bg-white text-brand-primary font-bold hover:bg-brand-primary-lighter h-10 rounded-lg"
                >
                  <Link href="/services?category=energy">
                    Find an Assessor <ArrowRight className="size-4 ml-1" />
                  </Link>
                </Button>
              </div>
              <Zap className="absolute -bottom-8 -right-8 size-36 text-white/10" />
            </div>

            {/* Energy Saving Tips */}
            <Card className="p-0 border-neutral-200 dark:border-neutral-800 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-bold text-sm uppercase tracking-widest text-neutral-400 mb-5">
                  Energy Saving Tips
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      icon: Monitor,
                      color: "bg-success-light dark:bg-success/20 text-success",
                      title: "Install Smart Meter",
                      desc: "Track real-time usage to spot costly habits instantly.",
                    },
                    {
                      icon: Droplets,
                      color: "bg-brand-accent-light dark:bg-brand-accent/20 text-brand-accent",
                      title: "Bleed Your Radiators",
                      desc: "Remove trapped air to keep your heating efficient.",
                    },
                    {
                      icon: Lightbulb,
                      color: "bg-warning-light dark:bg-warning/20 text-warning",
                      title: "Switch to LED Bulbs",
                      desc: "Save up to £55/year with energy-efficient lighting.",
                    },
                    {
                      icon: DoorOpen,
                      color: "bg-brand-accent-light dark:bg-brand-accent/20 text-brand-accent",
                      title: "Draft Proofing",
                      desc: "Simple seals around doors keep warmth inside.",
                    },
                  ].map(({ icon: Icon, color, title, desc }) => (
                    <div key={title} className="flex gap-3">
                      <div className={`w-9 h-9 shrink-0 rounded-xl ${color} flex items-center justify-center`}>
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-800 dark:text-white mb-0.5">{title}</h4>
                        <p className="text-[11px] text-neutral-500 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Related Tools */}
            <Card className="p-0 border-neutral-200 dark:border-neutral-800 shadow-sm">
              <CardContent className="p-5">
                <h3 className="font-bold text-xs uppercase tracking-widest text-neutral-400 mb-4">
                  Related Tools
                </h3>
                <div className="space-y-2">
                  {[
                    {
                      href: "/tools/mortgage-calculator",
                      icon: Calculator,
                      label: "Mortgage Calculator",
                      sub: "Estimate monthly repayments",
                    },
                    {
                      href: "/tools/stamp-duty-calculator",
                      icon: PoundSterling,
                      label: "Stamp Duty Calculator",
                      sub: "Calculate SDLT costs",
                    },
                    {
                      href: "/services?category=energy",
                      icon: Wrench,
                      label: "Find Energy Assessors",
                      sub: "Browse local professionals",
                    },
                  ].map(({ href, icon: Icon, label, sub }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-brand-primary-lighter flex items-center justify-center text-brand-primary shrink-0">
                        <Icon className="size-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold block group-hover:text-brand-primary transition-colors truncate">
                          {label}
                        </span>
                        <span className="text-[10px] text-neutral-400">{sub}</span>
                      </div>
                      <ChevronRight className="size-3.5 text-neutral-300 shrink-0" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      {/* Disclaimer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <p className="text-xs text-neutral-400 text-center">
          Estimates are indicative only and based on Ofgem data. Always consult an accredited assessor for an official EPC rating.
        </p>
      </div>
    </>
  );
}
