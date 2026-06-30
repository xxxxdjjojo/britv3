"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, MapPin, Sparkles, TrendingUp } from "lucide-react";

import { applyLaunchDiscount } from "@/lib/placements/pricing";
import type { EligibilityResult } from "@/lib/placements/eligibility";
import {
  PLACEMENT_TYPE_LABELS,
  type PlacementPerformance,
  type PlacementProduct,
  type SponsoredPlacement,
} from "@/types/sponsored-placements";

type ApiData = {
  placements: SponsoredPlacement[];
  performance: PlacementPerformance[];
  products: PlacementProduct[];
};

function formatGBP(pence: number): string {
  return `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function targetingLabel(p: Pick<PlacementProduct, "town" | "postcode_district" | "region_scope">): string {
  return p.postcode_district ?? p.town ?? p.region_scope ?? "Nationwide";
}

export function BoostMyProfile({ eligibility }: Readonly<{ eligibility: EligibilityResult }>) {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/provider/placements");
      if (!res.ok) throw new Error("Failed to load");
      setData((await res.json()) as ApiData);
    } catch {
      setError("Could not load your boosts. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function activate(productId: string) {
    setBusyId(productId);
    setError(null);
    try {
      const res = await fetch("/api/provider/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not start checkout.");
        return;
      }
      window.location.href = json.checkout_url;
    } catch {
      setError("Could not start checkout. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function manage(placementId: string, action: "pause" | "resume" | "cancel") {
    setBusyId(placementId);
    setError(null);
    try {
      const res = await fetch(`/api/provider/placements/${placementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? `Could not ${action} this boost.`);
        return;
      }
      await load();
    } catch {
      setError(`Could not ${action} this boost. Please try again.`);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  const perfById = new Map((data?.performance ?? []).map((p) => [p.placementId, p]));

  return (
    <div className="space-y-8">
      {!eligibility.eligible && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">You can&apos;t boost just yet</p>
            <p className="mt-1">
              Boosting requires{" "}
              {eligibility.reasons.includes("verification") && (
                <>
                  an{" "}
                  <Link href="/dashboard/provider/verification" className="font-medium underline">
                    approved profile
                  </Link>
                </>
              )}
              {eligibility.reasons.length === 2 && " and "}
              {eligibility.reasons.includes("subscription") && (
                <>
                  an{" "}
                  <Link href="/dashboard/provider/billing" className="font-medium underline">
                    active subscription
                  </Link>
                </>
              )}
              .
            </p>
          </div>
        </div>
      )}

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {/* Active placements */}
      {data && data.placements.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Your boosts</h2>
          <div className="space-y-3">
            {data.placements.map((pl) => {
              const perf = perfById.get(pl.id);
              return (
                <div key={pl.id} className="rounded-xl border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {PLACEMENT_TYPE_LABELS[pl.placement_type]}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {targetingLabel(pl)}
                        </span>
                      </p>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          pl.status === "active"
                            ? "bg-[color:var(--color-brand-primary-lighter,#E8F5EE)] text-[color:var(--color-brand-primary,#1B4D3E)]"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {pl.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {pl.status === "active" && (
                        <button
                          type="button"
                          disabled={busyId === pl.id}
                          onClick={() => manage(pl.id, "pause")}
                          className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                        >
                          Pause
                        </button>
                      )}
                      {pl.status === "paused" && (
                        <button
                          type="button"
                          disabled={busyId === pl.id}
                          onClick={() => manage(pl.id, "resume")}
                          className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                        >
                          Resume
                        </button>
                      )}
                      {pl.status !== "cancelled" && (
                        <button
                          type="button"
                          disabled={busyId === pl.id}
                          onClick={() => manage(pl.id, "cancel")}
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {perf && (
                    <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                      <Metric label="Impressions" value={perf.impressions.toLocaleString()} />
                      <Metric label="Clicks" value={perf.clicks.toLocaleString()} />
                      <Metric label="Enquiries" value={perf.enquiries.toLocaleString()} />
                      <Metric
                        label="Cost / enquiry"
                        value={perf.costPerEnquiryPence == null ? "—" : formatGBP(perf.costPerEnquiryPence)}
                      />
                      <Metric label="Conversion" value={`${Math.round(perf.conversionRate * 100)}%`} />
                    </dl>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Catalogue */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Available placements</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.products ?? []).map((product) => {
            const launchPrice = applyLaunchDiscount(
              product.monthly_price_pence,
              { launchDiscountPct: product.launch_discount_pct, launchDiscountMonths: product.launch_discount_months },
              0,
            );
            const hasLaunch = launchPrice < product.monthly_price_pence;
            return (
              <div key={product.id} className="flex flex-col rounded-2xl border bg-card p-5">
                <div className="mb-2 flex items-center gap-1.5">
                  <Sparkles className="size-4" style={{ color: "var(--color-brand-secondary, #A07D2E)" }} />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {PLACEMENT_TYPE_LABELS[product.placement_type]}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground">{product.name}</h3>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" /> {targetingLabel(product)}
                </p>

                <div className="mt-3">
                  {hasLaunch ? (
                    <p className="text-lg font-bold text-foreground">
                      {formatGBP(launchPrice)}
                      <span className="ml-1 text-xs font-normal text-muted-foreground line-through">
                        {formatGBP(product.monthly_price_pence)}
                      </span>
                      <span className="ml-1 text-xs font-normal text-muted-foreground">/mo</span>
                    </p>
                  ) : (
                    <p className="text-lg font-bold text-foreground">
                      {formatGBP(product.monthly_price_pence)}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">/mo</span>
                    </p>
                  )}
                  {hasLaunch && (
                    <p className="text-[11px] font-medium text-[color:var(--color-brand-primary,#1B4D3E)]">
                      Launch offer for {product.launch_discount_months} months
                    </p>
                  )}
                </div>

                {product.estimated_monthly_views > 0 && (
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-[color:var(--color-brand-primary-light,#2D7A5F)]">
                    <TrendingUp className="size-3" /> ~
                    {Math.round(product.estimated_monthly_views / Math.max(1, product.slot_limit)).toLocaleString()} views
                    /mo est.
                  </p>
                )}

                <button
                  type="button"
                  disabled={!eligibility.eligible || busyId === product.id}
                  onClick={() => activate(product.id)}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-[color:var(--color-brand-primary,#1B4D3E)] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[color:var(--color-brand-primary-light,#2D7A5F)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busyId === product.id && <Loader2 className="size-3.5 animate-spin" />}
                  Activate boost
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}
