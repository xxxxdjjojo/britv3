"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { gbpToPence, penceToGBP } from "@/lib/currency";
import type {
  AiMatchPreferences,
  AiMatchResult,
} from "@/services/ai/ai-match-service";
import {
  Sparkles,
  Loader2,
  MapPin,
  Bed,
  PoundSterling,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Zap,
  Heart,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GetResponse = {
  preferences: AiMatchPreferences | null;
  results: AiMatchResult[];
  resultsExpired: boolean;
};

type LifestyleEntry = { key: string; value: string };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BEDROOM_OPTIONS = ["1", "2", "3", "4", "5", "6+"] as const;

// Stitch lifestyle priorities for display
const LIFESTYLE_PRIORITY_BARS = [
  { label: "Commute Importance", filled: 2, total: 3 },
  { label: "School Proximity", filled: 3, total: 3 },
  { label: "Garden/Land Priority", filled: 3, total: 3 },
  { label: "Tech/Smart Home", filled: 1, total: 3 },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreVariant(score: number): {
  badge: string;
  dotColor: string;
  label: string;
} {
  if (score >= 0.8)
    return {
      badge: "bg-emerald-50 text-emerald-900 border border-emerald-100",
      dotColor: "bg-emerald-500",
      label: `${Math.round(score * 100)}% Match Confidence`,
    };
  if (score >= 0.6)
    return {
      badge: "bg-neutral-50 text-neutral-700 border border-neutral-200",
      dotColor: "bg-neutral-400",
      label: `${Math.round(score * 100)}% Match Confidence`,
    };
  return {
    badge: "bg-neutral-50 text-neutral-500 border border-neutral-200",
    dotColor: "bg-neutral-300",
    label: `${Math.round(score * 100)}% Match Confidence`,
  };
}

function formatGBP(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(penceToGBP(pence));
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AiMatchPage() {
  // ----- Preferences form state -------------------------------------------
  const [location, setLocation] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [bedroomsMin, setBedroomsMin] = useState("");
  const [bedroomsMax, setBedroomsMax] = useState("");
  const [mustHaves, setMustHaves] = useState("");
  const [lifestyle, setLifestyle] = useState<LifestyleEntry[]>([
    { key: "", value: "" },
  ]);

  // ----- Result / UI state ------------------------------------------------
  const [results, setResults] = useState<AiMatchResult[]>([]);
  const [resultsExpired, setResultsExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ----- Load existing prefs + results on mount ---------------------------
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-match", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load match data");
      const data: GetResponse = (await res.json()) as GetResponse;

      if (data.preferences) {
        const p = data.preferences;
        setLocation(p.location ?? "");
        setBudgetMin(
          p.budget_min !== null ? String(penceToGBP(p.budget_min)) : "",
        );
        setBudgetMax(
          p.budget_max !== null ? String(penceToGBP(p.budget_max)) : "",
        );
        setBedroomsMin(
          p.bedrooms_min !== null ? String(p.bedrooms_min) : "",
        );
        setBedroomsMax(
          p.bedrooms_max !== null ? String(p.bedrooms_max) : "",
        );
        setMustHaves(p.must_haves.join("\n"));

        const entries = Object.entries(p.lifestyle_factors);
        setLifestyle(
          entries.length > 0
            ? entries.map(([k, v]) => ({ key: k, value: v }))
            : [{ key: "", value: "" }],
        );
      }

      setResults(data.results);
      setResultsExpired(data.resultsExpired);
    } catch {
      setError("Could not load your match data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // ----- Lifestyle factor helpers -----------------------------------------
  const updateLifestyle = (
    index: number,
    field: "key" | "value",
    val: string,
  ) => {
    setLifestyle((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const addLifestyleEntry = () => {
    if (lifestyle.length < 5) {
      setLifestyle((prev) => [...prev, { key: "", value: "" }]);
    }
  };

  const removeLifestyleEntry = (index: number) => {
    setLifestyle((prev) => prev.filter((_, i) => i !== index));
  };

  // ----- Submit -----------------------------------------------------------
  const handleFindMatches = async () => {
    setIsAnalysing(true);
    setError(null);

    const lifestyleFactors: Record<string, string> = {};
    for (const entry of lifestyle) {
      if (entry.key.trim()) {
        lifestyleFactors[entry.key.trim()] = entry.value.trim();
      }
    }

    const payload: Omit<AiMatchPreferences, "id" | "user_id" | "updated_at"> =
      {
        location: location.trim() || null,
        budget_min: budgetMin ? gbpToPence(parseFloat(budgetMin)) : null,
        budget_max: budgetMax ? gbpToPence(parseFloat(budgetMax)) : null,
        bedrooms_min: bedroomsMin
          ? parseInt(bedroomsMin.replace("+", ""), 10)
          : null,
        bedrooms_max: bedroomsMax
          ? parseInt(bedroomsMax.replace("+", ""), 10)
          : null,
        must_haves: mustHaves
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        lifestyle_factors: lifestyleFactors,
      };

    try {
      const res = await fetch("/api/ai-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Analysis failed");
      }

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Analysis failed. Please try again.",
      );
    } finally {
      setIsAnalysing(false);
    }
  };

  // ----- Render -----------------------------------------------------------
  return (
    <div className="flex flex-col gap-12 pb-12">
      {/* ── Global error alert ────────────────────────────────────── */}
      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="size-4" strokeWidth={1.25} />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Section 1: Preferences + Lifestyle ───────────────────── */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left 2/3: Property Preferences */}
        <div className="space-y-8 lg:col-span-2">
          <div className="rounded-2xl bg-[#f4f3f2] p-8">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold tracking-tight text-neutral-900">
                Your Property Preferences
              </h2>
              <button
                type="button"
                className="border-b border-brand-primary-dark/20 pb-1 text-[10px] font-bold uppercase tracking-wider text-brand-primary-dark"
              >
                Edit All
              </button>
            </div>

            <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
              {/* Location */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-500">
                  Location Radius
                </label>
                <div className="flex items-center justify-between rounded-xl bg-white p-4">
                  <div className="relative flex-1">
                    <MapPin
                      className="absolute left-0 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
                      strokeWidth={1.25}
                    />
                    <input
                      id="location"
                      placeholder="e.g. Kensington, London"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-transparent pl-6 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                      aria-label="Location"
                    />
                  </div>
                  <Edit2 className="size-4 shrink-0 text-neutral-400" strokeWidth={1.25} />
                </div>
              </div>

              {/* Budget */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-500">
                  Budget Range
                </label>
                <div className="flex items-center gap-2 rounded-xl bg-white p-4">
                  <div className="flex flex-1 items-center gap-2">
                    <div className="relative flex-1">
                      <PoundSterling
                        className="absolute left-0 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
                        strokeWidth={1.25}
                      />
                      <input
                        type="number"
                        min={0}
                        placeholder="Min"
                        value={budgetMin}
                        onChange={(e) => setBudgetMin(e.target.value)}
                        className="w-full bg-transparent pl-5 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                        aria-label="Minimum budget"
                      />
                    </div>
                    <span className="text-neutral-300">—</span>
                    <div className="relative flex-1">
                      <PoundSterling
                        className="absolute left-0 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
                        strokeWidth={1.25}
                      />
                      <input
                        type="number"
                        min={0}
                        placeholder="Max"
                        value={budgetMax}
                        onChange={(e) => setBudgetMax(e.target.value)}
                        className="w-full bg-transparent pl-5 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                        aria-label="Maximum budget"
                      />
                    </div>
                  </div>
                  <Edit2 className="size-4 shrink-0 text-neutral-400" strokeWidth={1.25} />
                </div>
              </div>

              {/* Bedrooms */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-500">
                  Bedrooms
                </label>
                <div className="flex items-center gap-2 rounded-xl bg-white p-4">
                  <Bed
                    className="size-4 shrink-0 text-neutral-400"
                    strokeWidth={1.25}
                  />
                  <div className="flex flex-1 items-center gap-2">
                    <Select
                      value={bedroomsMin}
                      onValueChange={(v: string | null) =>
                        setBedroomsMin(v ?? "")
                      }
                    >
                      <SelectTrigger
                        id="bedrooms-min"
                        className="border-0 bg-transparent p-0 text-sm font-medium shadow-none focus:ring-0"
                      >
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        {BEDROOM_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-neutral-300">—</span>
                    <Select
                      value={bedroomsMax}
                      onValueChange={(v: string | null) =>
                        setBedroomsMax(v ?? "")
                      }
                    >
                      <SelectTrigger
                        id="bedrooms-max"
                        className="border-0 bg-transparent p-0 text-sm font-medium shadow-none focus:ring-0"
                      >
                        <SelectValue placeholder="Max" />
                      </SelectTrigger>
                      <SelectContent>
                        {BEDROOM_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Edit2 className="size-4 shrink-0 text-neutral-400" strokeWidth={1.25} />
                </div>
              </div>

              {/* Must haves */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="must-haves"
                  className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-500"
                >
                  Must Haves
                </label>
                <div className="rounded-xl bg-white p-4">
                  <Textarea
                    id="must-haves"
                    rows={3}
                    placeholder={"south-facing garden\noff-street parking\nnear good schools"}
                    value={mustHaves}
                    onChange={(e) => setMustHaves(e.target.value)}
                    className="resize-none border-0 bg-transparent p-0 text-sm font-medium shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>
            </div>

            {/* Lifestyle factors */}
            <div className="mt-8 flex flex-col gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-500">
                  Lifestyle Factors
                </p>
                <p className="mt-0.5 text-xs text-neutral-400">
                  Add up to 5 factors, e.g. &quot;commute&quot; /
                  &quot;under 30 min to Canary Wharf&quot;
                </p>
              </div>

              {lifestyle.map((entry, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Input
                    placeholder="Factor"
                    value={entry.key}
                    onChange={(e) => updateLifestyle(idx, "key", e.target.value)}
                    className="w-1/3 rounded-xl bg-white"
                    aria-label={`Lifestyle factor ${idx + 1} key`}
                  />
                  <Input
                    placeholder="Preference"
                    value={entry.value}
                    onChange={(e) =>
                      updateLifestyle(idx, "value", e.target.value)
                    }
                    className="flex-1 rounded-xl bg-white"
                    aria-label={`Lifestyle factor ${idx + 1} value`}
                  />
                  {lifestyle.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLifestyleEntry(idx)}
                      className="flex size-9 shrink-0 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:text-error"
                      aria-label={`Remove lifestyle factor ${idx + 1}`}
                    >
                      <Trash2 className="size-4" strokeWidth={1.25} />
                    </button>
                  )}
                </div>
              ))}

              {lifestyle.length < 5 && (
                <button
                  type="button"
                  onClick={addLifestyleEntry}
                  className="flex w-fit items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
                >
                  <Plus className="size-3.5" strokeWidth={1.5} />
                  Add factor
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right 1/3: Lifestyle Priorities + Generate */}
        <div className="space-y-8">
          <div className="rounded-2xl bg-[#e3e2e1] p-8">
            <h2 className="font-heading mb-8 text-lg font-bold tracking-tight text-neutral-900">
              Lifestyle Priorities
            </h2>

            <div className="flex flex-col gap-6">
              {LIFESTYLE_PRIORITY_BARS.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-800">
                    {item.label}
                  </span>
                  <div className="flex gap-1">
                    {Array.from({ length: item.total }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 w-6 rounded-full ${
                          i < item.filled
                            ? "bg-brand-primary-dark"
                            : "bg-neutral-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => void handleFindMatches()}
                  disabled={isAnalysing || isLoading}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-brand-primary-dark py-4 text-sm font-bold text-white shadow-xl shadow-brand-primary-dark/10 transition-opacity hover:opacity-90 disabled:opacity-60"
                  aria-label="Generate AI property matches"
                >
                  {isAnalysing ? (
                    <>
                      <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
                      Analysing properties…
                    </>
                  ) : (
                    <>
                      <Zap className="size-4" strokeWidth={1.5} />
                      Generate Matches
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Results Header ─────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <span className="block text-[10px] font-extrabold uppercase tracking-[0.3em] text-brand-secondary-dark">
            Curation results
          </span>
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-emerald-950">
            Intelligent Selections
          </h2>
        </div>
        {results.length > 0 && (
          <div className="flex gap-4">
            <button
              type="button"
              className="rounded-full border border-neutral-100 bg-white px-6 py-2 text-xs font-bold transition-colors hover:bg-neutral-50"
            >
              Sort by Confidence
            </button>
            <button
              type="button"
              onClick={() => void handleFindMatches()}
              disabled={isAnalysing || isLoading}
              className="flex items-center gap-1.5 rounded-full border border-neutral-100 bg-white px-6 py-2 text-xs font-bold transition-colors hover:bg-neutral-50 disabled:opacity-50"
              aria-label="Refresh matches"
            >
              <RefreshCw className="size-3.5" strokeWidth={1.5} />
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Stale results banner */}
      {resultsExpired && (
        <Alert className="rounded-xl border-amber-200 bg-amber-50 text-amber-800">
          <AlertCircle className="size-4" strokeWidth={1.25} />
          <AlertDescription className="text-sm">
            Your matches are from over 24 hours ago. Click &quot;Generate
            Matches&quot; to refresh.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Section 3: Match Results ──────────────────────────────── */}
      {isLoading && (
        <div className="flex flex-col gap-8">
          {[1, 2].map((i) => (
            <MatchResultSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && results.length === 0 && (
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-white p-16 text-center shadow-sm">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[#f4f3f2]">
            <Sparkles className="size-8 text-neutral-400" strokeWidth={1.25} />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-heading text-lg font-bold text-neutral-700">
              No matches yet
            </p>
            <p className="max-w-xs text-sm text-neutral-500">
              Fill in your preferences above and click &quot;Generate
              Matches&quot; to get started.
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {!isLoading && results.length > 0 && (
        <div className="flex flex-col gap-12">
          {results.map((result) => (
            <MatchResultCard key={result.id} result={result} />
          ))}
        </div>
      )}

      {/* ── CTA Banner ────────────────────────────────────────────── */}
      {!isLoading && (
        <div className="relative overflow-hidden rounded-3xl bg-brand-primary-dark p-12 text-center text-white">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-primary-dark to-[#1b4d3e] opacity-50" />
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="font-heading mb-4 text-2xl font-bold">
              Refine Your Vision
            </h2>
            <p className="mb-8 text-sm text-white/70">
              The more you interact with the platform—saving properties, browsing
              styles—the more accurate your AI Match engine becomes. Last updated:
              2 hours ago.
            </p>
            <button
              type="button"
              className="rounded-full bg-[#7b5804] px-8 py-3 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
            >
              Update Lifestyle Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Match result card
// ---------------------------------------------------------------------------

function MatchResultCard({ result }: Readonly<{ result: AiMatchResult }>) {
  const score = result.match_score;
  const { dotColor, label } = scoreVariant(score);
  const isTopMatch = score >= 0.8;

  return (
    <div className="group">
      <div className="relative grid grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-sm transition-all duration-700 group-hover:shadow-md lg:grid-cols-12">
        {/* Image */}
        <div className="relative overflow-hidden lg:col-span-5 lg:aspect-auto">
          <div className="flex aspect-[4/5] w-full items-center justify-center bg-neutral-100 lg:h-full lg:aspect-auto">
            <Heart className="size-16 text-neutral-200" strokeWidth={1} />
          </div>
          {/* Match confidence badge */}
          <div className="absolute left-6 top-6">
            <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 backdrop-blur-md">
              <span
                className={`size-2 rounded-full ${dotColor} ${isTopMatch ? "animate-pulse" : ""}`}
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-900">
                {label}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col justify-between p-8 lg:col-span-7 lg:p-12">
          <div>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="font-heading text-2xl font-bold text-emerald-950">
                  {result.listing?.address ?? "Unknown address"}
                </h3>
              </div>
              {result.listing && (
                <p className="font-heading text-2xl font-bold text-brand-primary-dark">
                  {formatGBP(result.listing.price)}
                </p>
              )}
            </div>

            {result.listing && result.listing.bedrooms != null && (
              <div className="mb-8 flex gap-8">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Bedrooms
                  </span>
                  <span className="text-sm font-semibold text-neutral-900">
                    {result.listing.bedrooms} bed
                  </span>
                </div>
                {result.listing.property_type && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Type
                    </span>
                    <span className="text-sm font-semibold capitalize text-neutral-900">
                      {result.listing.property_type.replace(/_/g, " ")}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Why this match */}
            {result.match_reasons.length > 0 && (
              <div
                className={`rounded-2xl border-l-4 p-6 ${
                  isTopMatch
                    ? "border-emerald-900 bg-emerald-50/50"
                    : "border-brand-secondary-dark bg-neutral-50"
                }`}
              >
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles
                    className={`size-4 ${isTopMatch ? "text-emerald-900" : "text-brand-secondary-dark"}`}
                    strokeWidth={1.5}
                  />
                  <h4
                    className={`text-xs font-bold uppercase tracking-widest ${
                      isTopMatch ? "text-emerald-900" : "text-brand-secondary-dark"
                    }`}
                  >
                    Why this match?
                  </h4>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {result.match_reasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-neutral-700">
                      <CheckCircle2
                        className="mt-0.5 size-3.5 shrink-0 text-emerald-600"
                        strokeWidth={1.5}
                      />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="mt-8 flex gap-4">
            <Link
              href={
                result.listing?.id
                  ? `/property/${result.listing.id}`
                  : "/search"
              }
              className="flex flex-1 items-center justify-center rounded-xl bg-brand-primary-dark py-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              View Property
            </Link>
            <button
              type="button"
              className="rounded-xl border border-neutral-100 px-6 py-4 transition-colors hover:bg-neutral-50"
              aria-label="Save property"
            >
              <Heart className="size-5 text-neutral-500" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton for match results
// ---------------------------------------------------------------------------

function MatchResultSkeleton() {
  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-sm lg:grid-cols-12">
      <div className="lg:col-span-5">
        <Skeleton className="aspect-[4/5] w-full lg:h-full" />
      </div>
      <div className="flex flex-col gap-4 p-8 lg:col-span-7 lg:p-12">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-7 w-28" />
        </div>
        <div className="flex gap-8">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    </div>
  );
}
