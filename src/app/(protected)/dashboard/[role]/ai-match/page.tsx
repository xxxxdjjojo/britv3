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
import { gbpToPence, penceToGBP } from "@/lib/currency";
import { toast } from "sonner";
import { X } from "lucide-react";
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
  if (score >= 0.8) return "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800";
  if (score >= 0.6) return "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800";
  return "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800";
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

  // ----- Dismiss a match --------------------------------------------------
  const handleDismiss = async (listingId: string) => {
    try {
      const res = await fetch("/api/ai-match/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId, feedback_type: "dismissed" }),
      });
      if (!res.ok) throw new Error("Failed to dismiss");
      setResults((prev) => prev.filter((r) => r.listing_id !== listingId));
      toast.success("Property dismissed");
    } catch {
      toast.error("Could not dismiss property. Please try again.");
    }
  };

  // ----- Render -----------------------------------------------------------
  return (
    <div className="space-y-8 p-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Property Match</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Tell us what you&apos;re looking for and our AI will score every active
          listing against your preferences.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Section 1: Match Preferences (7.15)                                  */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle>Match Preferences</CardTitle>
          <CardDescription>
            Set your criteria — we&apos;ll use these to find your best-fit properties.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

          {/* Must haves */}
          <div className="space-y-2">
            <Label htmlFor="must-haves">Must haves</Label>
            <p className="text-xs text-muted-foreground">One per line, e.g. &quot;south-facing garden&quot;</p>
            <Textarea
              id="must-haves"
              rows={4}
              placeholder={"south-facing garden\noff-street parking\nnear good schools"}
              value={mustHaves}
              onChange={(e) => setMustHaves(e.target.value)}
            />
          </div>

          {/* Lifestyle factors */}
          <div className="space-y-3">
            <Label>Lifestyle factors</Label>
            <p className="text-xs text-muted-foreground">
              Add up to 5 key/value pairs, e.g. &quot;commute&quot; / &quot;under 30 min to Canary Wharf&quot;
            </p>
            {lifestyle.map((entry, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <Input
                  placeholder="Key"
                  value={entry.key}
                  onChange={(e) => updateLifestyle(idx, "key", e.target.value)}
                  className="w-1/3"
                />
                <Input
                  placeholder="Value"
                  value={entry.value}
                  onChange={(e) => updateLifestyle(idx, "value", e.target.value)}
                  className="flex-1"
                />
                {lifestyle.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLifestyleEntry(idx)}
                    className="text-muted-foreground hover:text-red-500 shrink-0"
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
              >
                + Add another
              </Button>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={handleFindMatches}
            disabled={isAnalysing || isLoading}
            className="w-full"
          >
            {isAnalysing ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
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
              "Find My Matches"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2: My Matches (7.16)                                         */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle>My Matches</CardTitle>
          <CardDescription>
            Properties scored by AI against your preferences. Results are valid
            for 24 hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stale results banner */}
          {resultsExpired && (
            <Alert className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200">
              <AlertDescription>
                Your matches are from over 24 hours ago. Click &quot;Find My
                Matches&quot; to refresh.
              </AlertDescription>
            </Alert>
          )}

          {/* Loading state */}
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading matches...</p>
          )}

          {/* Empty state */}
          {!isLoading && results.length === 0 && !resultsExpired && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No matches yet — fill in your preferences and click &quot;Find My
              Matches&quot;.
            </p>
          )}

          {/* Results list */}
          {results.map((result) => (
            <div
              key={result.id}
              className="border rounded-lg p-4 space-y-3 bg-card shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">
                      {result.listing?.address ?? "Unknown address"}
                    </p>
                    {result.listing?.status === "under_offer" && (
                      <Badge variant="secondary" className="shrink-0 text-xs bg-orange-100 text-orange-800 border-orange-200">
                        Under Offer
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {result.listing ? formatGBP(result.listing.price) : "—"}
                    {result.listing?.bedrooms !== null && result.listing?.bedrooms !== undefined
                      ? ` · ${result.listing.bedrooms} bed`
                      : ""}
                    {result.listing?.property_type
                      ? ` · ${result.listing.property_type}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    className={`text-sm font-semibold border ${scoreColor(result.match_score)}`}
                  >
                    {Math.round(result.match_score * 100)}% match
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDismiss(result.listing_id)}
                    title="Not for me"
                  >
                    <X className="size-4" />
                    <span className="sr-only">Dismiss</span>
                  </Button>
                </div>
              </div>

              {result.match_reasons.length > 0 && (
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  {result.match_reasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
