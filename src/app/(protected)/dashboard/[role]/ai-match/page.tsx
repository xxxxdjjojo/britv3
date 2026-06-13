/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Heart, Home, MessageCircle, Sparkles, Video } from "lucide-react";
import { InsightPanel } from "@/components/dashboard/InsightPanel";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { gbpToPence, penceToGBP } from "@/lib/currency";
import type { AiMatchPreferences, AiMatchResult } from "@/services/ai/ai-match-service";

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
// Helpers
// ---------------------------------------------------------------------------

const BEDROOM_OPTIONS = ["1", "2", "3", "4", "5", "6+"] as const;

function scoreColor(score: number): string {
  if (score >= 0.8) return "bg-green-100 text-green-800 border-green-200";
  if (score >= 0.6) return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-red-100 text-red-800 border-red-200";
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
  const [mustHaves, setMustHaves] = useState(""); // newline-separated
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
      const data: GetResponse = await res.json() as GetResponse;

      if (data.preferences) {
        const p = data.preferences;
        setLocation(p.location ?? "");
        setBudgetMin(p.budget_min !== null ? String(penceToGBP(p.budget_min)) : "");
        setBudgetMax(p.budget_max !== null ? String(penceToGBP(p.budget_max)) : "");
        setBedroomsMin(p.bedrooms_min !== null ? String(p.bedrooms_min) : "");
        setBedroomsMax(p.bedrooms_max !== null ? String(p.bedrooms_max) : "");
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
    } catch (err) {
      console.error(err);
      setError("Could not load your match data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // ----- Lifestyle factor helpers -----------------------------------------
  const updateLifestyle = (index: number, field: "key" | "value", val: string) => {
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

    const payload: Omit<AiMatchPreferences, "id" | "user_id" | "updated_at"> = {
      location: location.trim() || null,
      budget_min: budgetMin ? gbpToPence(parseFloat(budgetMin)) : null,
      budget_max: budgetMax ? gbpToPence(parseFloat(budgetMax)) : null,
      bedrooms_min: bedroomsMin ? parseInt(bedroomsMin.replace("+", ""), 10) : null,
      bedrooms_max: bedroomsMax ? parseInt(bedroomsMax.replace("+", ""), 10) : null,
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
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? "Analysis failed");
      }

      // Reload results after analysis
      await loadData();
    } catch (err) {
      console.error(err);
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
    <div className="mx-auto max-w-5xl space-y-10 p-6">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-primary/70">
          AI Match Engine
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold text-brand-primary-dark">
          AI Property Match
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500">
          Tell us what you&apos;re looking for and our AI will score every active
          listing against your preferences.
        </p>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Section 1: Match Preferences (7.15)                                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Your Property Preferences ---------------------------------------- */}
        <Card className="rounded-xl border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-base text-brand-primary-dark">
              Your Property Preferences
            </CardTitle>
            <CardDescription>
              Set your criteria — we&apos;ll use these to find your best-fit properties.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Budget */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget-min">Budget min (£)</Label>
                <Input
                  id="budget-min"
                  type="number"
                  min={0}
                  placeholder="e.g. 200000"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget-max">Budget max (£)</Label>
                <Input
                  id="budget-max"
                  type="number"
                  min={0}
                  placeholder="e.g. 500000"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                />
              </div>
            </div>

            {/* Bedrooms */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms-min">Bedrooms min</Label>
                <Select value={bedroomsMin} onValueChange={(v: string | null) => setBedroomsMin(v ?? "")}>
                  <SelectTrigger id="bedrooms-min">
                    <SelectValue placeholder="Select" />
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
              <div className="space-y-2">
                <Label htmlFor="bedrooms-max">Bedrooms max</Label>
                <Select value={bedroomsMax} onValueChange={(v: string | null) => setBedroomsMax(v ?? "")}>
                  <SelectTrigger id="bedrooms-max">
                    <SelectValue placeholder="Select" />
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
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g. Kensington, London"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Must haves */}
            <div className="space-y-2">
              <Label htmlFor="must-haves">Must haves</Label>
              <p className="text-xs text-neutral-500">One per line, e.g. &quot;south-facing garden&quot;</p>
              <Textarea
                id="must-haves"
                rows={4}
                placeholder={"south-facing garden\noff-street parking\nnear good schools"}
                value={mustHaves}
                onChange={(e) => setMustHaves(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Lifestyle Preferences -------------------------------------------- */}
        <Card className="rounded-xl border border-border bg-brand-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-base text-brand-primary-dark">
              Lifestyle Preferences
            </CardTitle>
            <CardDescription>
              Add up to 5 key/value pairs, e.g. &quot;commute&quot; / &quot;under 30 min to Canary Wharf&quot;
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lifestyle.map((entry, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Input
                  placeholder="Key"
                  value={entry.key}
                  onChange={(e) => updateLifestyle(idx, "key", e.target.value)}
                  className="w-1/3 bg-white"
                />
                <Input
                  placeholder="Value"
                  value={entry.value}
                  onChange={(e) => updateLifestyle(idx, "value", e.target.value)}
                  className="flex-1 bg-white"
                />
                {lifestyle.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLifestyleEntry(idx)}
                    className="shrink-0 text-neutral-400 hover:text-red-500"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            {lifestyle.length < 5 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLifestyleEntry}
                className="bg-white"
              >
                + Add another
              </Button>
            )}

            {/* Recalibrate Matches */}
            <Button
              onClick={handleFindMatches}
              disabled={isAnalysing || isLoading}
              className="w-full gap-2 bg-brand-primary text-white hover:bg-brand-primary-dark"
            >
              {isAnalysing ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Analysing properties with AI...
                </span>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Recalibrate Matches
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2: Intelligent Selections (7.16)                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-5">
        <SectionHeader title="Intelligent Selections" />

        {/* Stale results banner */}
        {resultsExpired && (
          <Alert className="border-amber-300 bg-amber-50 text-amber-800">
            <AlertDescription>
              Your matches are from over 24 hours ago. Click &quot;Recalibrate
              Matches&quot; to refresh.
            </AlertDescription>
          </Alert>
        )}

        {/* Loading state */}
        {isLoading && (
          <p className="text-sm text-neutral-500">Loading matches...</p>
        )}

        {/* Empty state */}
        {!isLoading && results.length === 0 && !resultsExpired && (
          <div className="rounded-xl border border-dashed border-border bg-surface py-12 text-center">
            <Sparkles className="mx-auto size-6 text-brand-primary/40" />
            <p className="mt-3 text-sm text-neutral-500">
              No matches yet — fill in your preferences and click &quot;Recalibrate
              Matches&quot;.
            </p>
          </div>
        )}

        {/* Results list */}
        <div className="space-y-6">
          {results.map((result) => (
            <article
              key={result.id}
              className="overflow-hidden rounded-xl border border-border bg-white shadow-sm md:flex"
            >
              {/* Property image */}
              <div className="relative flex aspect-[4/3] items-center justify-center bg-brand-primary/10 md:aspect-auto md:w-72 md:shrink-0">
                <Home className="size-10 text-brand-primary/40" />
                <button
                  type="button"
                  aria-label="Save property"
                  className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/90 text-neutral-500 shadow-sm transition-colors hover:text-red-500"
                >
                  <Heart className="size-4" />
                </button>
              </div>

              {/* Property detail */}
              <div className="flex flex-1 flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <h3 className="truncate font-heading text-lg font-bold text-brand-primary-dark">
                      {result.listing?.address ?? "Unknown address"}
                    </h3>
                    <p className="text-sm font-semibold text-neutral-900">
                      {result.listing ? formatGBP(result.listing.price) : "—"}
                      {result.listing?.bedrooms !== null && result.listing?.bedrooms !== undefined
                        ? ` · ${result.listing.bedrooms} bed`
                        : ""}
                      {result.listing?.property_type
                        ? ` · ${result.listing.property_type}`
                        : ""}
                    </p>
                  </div>
                  <Badge
                    className={`shrink-0 border-0 text-sm font-semibold ${scoreColor(result.match_score)}`}
                  >
                    {Math.round(result.match_score * 100)}% match
                  </Badge>
                </div>

                {result.match_reasons.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {result.match_reasons.map((reason, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-medium text-brand-primary"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    className="gap-2 bg-brand-primary text-white hover:bg-brand-primary-dark"
                  >
                    <MessageCircle className="size-4" />
                    Ask AI Concierge
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="gap-2">
                    <Home className="size-4" />
                    Schedule Private Viewing
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="gap-2 text-brand-primary">
                    <Video className="size-4" />
                    Request Virtual Tour
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 3: Refine Your Vision                                       */}
      {/* ------------------------------------------------------------------ */}
      <InsightPanel
        title="Refine Your Vision"
        eyebrow="Bespoke Matching"
        icon={Sparkles}
        action={{ label: "Recalibrate Matches", href: "#" }}
      >
        The more you tell us, the sharper your matches become. Adjust your budget,
        lifestyle and must-haves above, then let our AI re-score every active
        listing against the home you actually want.
      </InsightPanel>
    </div>
  );
}
