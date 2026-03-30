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
  Bath,
  PoundSterling,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  SlidersHorizontal,
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreVariant(score: number): {
  badge: string;
  label: string;
} {
  if (score >= 0.8)
    return {
      badge: "bg-success-light border-success/30 text-success",
      label: "Excellent",
    };
  if (score >= 0.6)
    return {
      badge: "bg-warning-light border-warning/30 text-warning",
      label: "Good",
    };
  return {
    badge: "bg-error-light border-error/30 text-error",
    label: "Fair",
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
        budget_min: budgetMin
          ? gbpToPence(parseFloat(budgetMin))
          : null,
        budget_max: budgetMax
          ? gbpToPence(parseFloat(budgetMax))
          : null,
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
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Sparkles
            className="size-5 text-brand-secondary"
            strokeWidth={1.25}
          />
          <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-900">
            AI Property Match
          </h1>
        </div>
        <p className="text-sm text-neutral-500">
          Tell us what you&apos;re looking for and our AI will score every
          active listing against your preferences.
        </p>
      </div>

      {/* ── Global error alert ────────────────────────────────────── */}
      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="size-4" strokeWidth={1.25} />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Section 1: Match Preferences ──────────────────────────── */}
      <Card className="overflow-hidden rounded-2xl shadow-sm">
        <CardHeader className="border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand-primary-lighter">
              <SlidersHorizontal
                className="size-4 text-brand-primary"
                strokeWidth={1.25}
              />
            </div>
            <div>
              <CardTitle className="font-heading text-base font-semibold text-neutral-900">
                Match Preferences
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500">
                Set your criteria — we&apos;ll use these to find your
                best-fit properties.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 pt-6">
          {/* Location */}
          <FieldGroup label="Location" htmlFor="location">
            <div className="relative">
              <MapPin
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
                strokeWidth={1.25}
              />
              <Input
                id="location"
                placeholder="e.g. Kensington, London"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="rounded-xl pl-9"
              />
            </div>
          </FieldGroup>

          {/* Budget */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-neutral-700">Budget</p>
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Minimum (£)" htmlFor="budget-min">
                <div className="relative">
                  <PoundSterling
                    className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
                    strokeWidth={1.25}
                  />
                  <Input
                    id="budget-min"
                    type="number"
                    min={0}
                    placeholder="200,000"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    className="rounded-xl pl-9"
                  />
                </div>
              </FieldGroup>
              <FieldGroup label="Maximum (£)" htmlFor="budget-max">
                <div className="relative">
                  <PoundSterling
                    className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
                    strokeWidth={1.25}
                  />
                  <Input
                    id="budget-max"
                    type="number"
                    min={0}
                    placeholder="500,000"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    className="rounded-xl pl-9"
                  />
                </div>
              </FieldGroup>
            </div>
          </div>

          {/* Bedrooms */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-neutral-700">Bedrooms</p>
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Minimum" htmlFor="bedrooms-min">
                <div className="relative">
                  <Bed
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
                    strokeWidth={1.25}
                  />
                  <Select
                    value={bedroomsMin}
                    onValueChange={(v: string | null) =>
                      setBedroomsMin(v ?? "")
                    }
                  >
                    <SelectTrigger
                      id="bedrooms-min"
                      className="rounded-xl pl-9"
                    >
                      <SelectValue placeholder="Any" />
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
              </FieldGroup>
              <FieldGroup label="Maximum" htmlFor="bedrooms-max">
                <div className="relative">
                  <Bed
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
                    strokeWidth={1.25}
                  />
                  <Select
                    value={bedroomsMax}
                    onValueChange={(v: string | null) =>
                      setBedroomsMax(v ?? "")
                    }
                  >
                    <SelectTrigger
                      id="bedrooms-max"
                      className="rounded-xl pl-9"
                    >
                      <SelectValue placeholder="Any" />
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
              </FieldGroup>
            </div>
          </div>

          {/* Must haves */}
          <FieldGroup
            label="Must haves"
            htmlFor="must-haves"
            hint={`One feature per line, e.g. "south-facing garden"`}
          >
            <Textarea
              id="must-haves"
              rows={4}
              placeholder={"south-facing garden\noff-street parking\nnear good schools"}
              value={mustHaves}
              onChange={(e) => setMustHaves(e.target.value)}
              className="rounded-xl resize-none"
            />
          </FieldGroup>

          {/* Lifestyle factors */}
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-sm font-medium text-neutral-700">
                Lifestyle factors
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                Add up to 5 key/value pairs, e.g. &quot;commute&quot; /
                &quot;under 30 min to Canary Wharf&quot;
              </p>
            </div>

            {lifestyle.map((entry, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Input
                  placeholder="Factor"
                  value={entry.key}
                  onChange={(e) =>
                    updateLifestyle(idx, "key", e.target.value)
                  }
                  className="w-1/3 rounded-xl"
                  aria-label={`Lifestyle factor ${idx + 1} key`}
                />
                <Input
                  placeholder="Preference"
                  value={entry.value}
                  onChange={(e) =>
                    updateLifestyle(idx, "value", e.target.value)
                  }
                  className="flex-1 rounded-xl"
                  aria-label={`Lifestyle factor ${idx + 1} value`}
                />
                {lifestyle.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLifestyleEntry(idx)}
                    className="size-9 shrink-0 rounded-xl p-0 text-neutral-400 hover:text-error"
                    aria-label={`Remove lifestyle factor ${idx + 1}`}
                  >
                    <Trash2 className="size-4" strokeWidth={1.25} />
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
                className="w-fit gap-2 rounded-xl text-xs"
              >
                <Plus className="size-3.5" strokeWidth={1.25} />
                Add factor
              </Button>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={() => void handleFindMatches()}
            disabled={isAnalysing || isLoading}
            className="h-11 w-full gap-2 rounded-xl bg-brand-primary text-white hover:bg-brand-primary-light disabled:opacity-60"
          >
            {isAnalysing ? (
              <>
                <Loader2
                  className="size-4 animate-spin"
                  strokeWidth={1.25}
                />
                Analysing properties with AI…
              </>
            ) : (
              <>
                <Sparkles className="size-4" strokeWidth={1.25} />
                Find My Matches
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ── Section 2: My Matches ─────────────────────────────────── */}
      <Card className="overflow-hidden rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand-primary-lighter">
              <Sparkles
                className="size-4 text-brand-primary"
                strokeWidth={1.25}
              />
            </div>
            <div>
              <CardTitle className="font-heading text-base font-semibold text-neutral-900">
                My Matches
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500">
                Properties scored by AI against your preferences. Results
                are valid for 24 hours.
              </CardDescription>
            </div>
          </div>

          {results.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleFindMatches()}
              disabled={isAnalysing || isLoading}
              className="h-8 gap-1.5 rounded-xl px-2 text-xs text-neutral-500 hover:text-brand-primary"
              aria-label="Refresh matches"
            >
              <RefreshCw className="size-3.5" strokeWidth={1.25} />
              Refresh
            </Button>
          )}
        </CardHeader>

        <CardContent className="flex flex-col gap-4 pt-5">
          {/* Stale results banner */}
          {resultsExpired && (
            <Alert className="rounded-xl border-warning/30 bg-warning-light text-warning">
              <AlertCircle className="size-4" strokeWidth={1.25} />
              <AlertDescription className="text-sm">
                Your matches are from over 24 hours ago. Click &quot;Find My
                Matches&quot; to refresh.
              </AlertDescription>
            </Alert>
          )}

          {/* Loading skeleton */}
          {isLoading && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <MatchResultSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && results.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-neutral-100">
                <Sparkles
                  className="size-7 text-neutral-400"
                  strokeWidth={1.25}
                />
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-heading text-sm font-semibold text-neutral-700">
                  No matches yet
                </p>
                <p className="max-w-xs text-xs text-neutral-500">
                  Fill in your preferences above and click &quot;Find My
                  Matches&quot; to get started.
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          {!isLoading &&
            results.map((result) => (
              <MatchResultCard key={result.id} result={result} />
            ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Match result card
// ---------------------------------------------------------------------------

function MatchResultCard({
  result,
}: Readonly<{ result: AiMatchResult }>) {
  const score = result.match_score;
  const { badge, label } = scoreVariant(score);
  const pct = Math.round(score * 100);

  return (
    <div className="overflow-hidden rounded-xl bg-neutral-50 p-4 transition-colors hover:bg-neutral-100">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="font-heading text-sm font-semibold text-neutral-900 truncate">
            {result.listing?.address ?? "Unknown address"}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
            {result.listing && (
              <span className="font-medium text-neutral-700">
                {formatGBP(result.listing.price)}
              </span>
            )}
            {result.listing?.bedrooms != null && (
              <span className="flex items-center gap-0.5">
                <Bed className="size-3" strokeWidth={1.25} />
                {result.listing.bedrooms} bed
              </span>
            )}
            {result.listing?.bathrooms != null && (
              <span className="flex items-center gap-0.5">
                <Bath className="size-3" strokeWidth={1.25} />
                {result.listing.bathrooms} bath
              </span>
            )}
            {result.listing?.property_type && (
              <span className="capitalize">
                {result.listing.property_type.replace(/_/g, " ")}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge
            className={`border text-xs font-semibold ${badge}`}
          >
            {pct}% {label}
          </Badge>
        </div>
      </div>

      {result.match_reasons.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {result.match_reasons.map((reason, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs text-neutral-600"
            >
              <CheckCircle2
                className="mt-0.5 size-3 shrink-0 text-success"
                strokeWidth={1.25}
              />
              {reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton for match results
// ---------------------------------------------------------------------------

function MatchResultSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-neutral-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field group helper
// ---------------------------------------------------------------------------

function FieldGroup({
  label,
  htmlFor,
  hint,
  children,
}: Readonly<{
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={htmlFor}
        className="text-sm font-medium text-neutral-700"
      >
        {label}
      </Label>
      {hint && (
        <p className="text-xs text-neutral-500">{hint}</p>
      )}
      {children}
    </div>
  );
}
