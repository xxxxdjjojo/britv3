"use client";

import { useEffect, useState } from "react";
import { Info, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

type Frequency = "instant" | "daily" | "weekly" | "monthly";

type EmailSubscriptionPrefs = {
  weekly_digest: boolean;
  market_report: boolean;
  market_report_frequency: Frequency;
  listing_alerts: boolean;
  listing_alerts_frequency: Frequency;
  price_change_alerts: boolean;
  promotional_offers: boolean;
};

const DEFAULT_PREFS: EmailSubscriptionPrefs = {
  weekly_digest: true,
  market_report: true,
  market_report_frequency: "weekly",
  listing_alerts: true,
  listing_alerts_frequency: "daily",
  price_change_alerts: true,
  promotional_offers: false,
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="space-y-1.5">
        <div className="h-4 w-40 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-3 w-64 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
      </div>
      <div className="h-5 w-10 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
    </div>
  );
}

function SkeletonSection() {
  return (
    <div className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className={
            i < 2
              ? "border-b border-neutral-100/60 dark:border-neutral-700/60"
              : ""
          }
        >
          <SkeletonRow />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Frequency Select
// ---------------------------------------------------------------------------

type FrequencyOption = { value: Frequency; label: string };

function FrequencySelect({
  id,
  value,
  options,
  onChange,
}: Readonly<{
  id: string;
  value: Frequency;
  options: readonly FrequencyOption[];
  onChange: (v: Frequency) => void;
}>) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as Frequency)}
      className="rounded-lg border border-neutral-200 bg-card px-3 py-1.5 font-body text-xs text-foreground transition-colors hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 dark:border-neutral-700 dark:hover:border-neutral-600"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EmailSubscriptionsPage() {
  const [prefs, setPrefs] = useState<EmailSubscriptionPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPrefs() {
      try {
        const res = await fetch("/api/settings/email-subscriptions");
        if (!res.ok) throw new Error("Failed to load");
        const data: Partial<EmailSubscriptionPrefs> = await res.json();
        setPrefs({ ...DEFAULT_PREFS, ...data });
      } catch {
        // Fall back to defaults if API doesn't exist yet
        setPrefs(DEFAULT_PREFS);
      } finally {
        setLoading(false);
      }
    }
    void loadPrefs();
  }, []);

  function handleToggle<K extends keyof EmailSubscriptionPrefs>(
    key: K,
    value: EmailSubscriptionPrefs[K],
  ) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/email-subscriptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Email preferences saved.", { duration: 2500 });
    } catch {
      toast.error("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUnsubscribeAll() {
    const updated: EmailSubscriptionPrefs = {
      ...prefs,
      weekly_digest: false,
      market_report: false,
      listing_alerts: false,
      price_change_alerts: false,
      promotional_offers: false,
    };

    setPrefs(updated);

    try {
      const res = await fetch("/api/settings/email-subscriptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Unsubscribed from all marketing emails.", {
        duration: 3000,
      });
    } catch {
      // Revert on failure
      setPrefs(prefs);
      toast.error("Failed to unsubscribe. Please try again.");
    }
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Email Subscriptions
        </h2>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Manage which emails you receive and how often.
        </p>
      </div>

      {/* Property & Market Emails */}
      <section className="space-y-4">
        <h3 className="font-heading text-base font-semibold text-foreground">
          Property & Market Emails
        </h3>

        {loading ? (
          <SkeletonSection />
        ) : (
          <div className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
            {/* Weekly property digest */}
            <div className="border-b border-neutral-100/60 dark:border-neutral-700/60">
              <div className="flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm font-medium text-foreground">
                    Weekly Property Digest
                  </p>
                  <p className="font-body text-xs text-neutral-500">
                    A curated weekly summary of properties matching your saved
                    searches.
                  </p>
                </div>
                <Switch
                  id="weekly-digest"
                  checked={prefs.weekly_digest}
                  onCheckedChange={(checked) =>
                    handleToggle("weekly_digest", checked)
                  }
                  size="sm"
                />
              </div>
            </div>

            {/* Market report emails */}
            <div className="border-b border-neutral-100/60 dark:border-neutral-700/60">
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm font-medium text-foreground">
                    Market Report Emails
                  </p>
                  <p className="font-body text-xs text-neutral-500">
                    Area price trends, mortgage rate summaries, and market
                    insights.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {prefs.market_report && (
                    <FrequencySelect
                      id="market-report-frequency"
                      value={prefs.market_report_frequency}
                      options={[
                        { value: "weekly", label: "Weekly" },
                        { value: "monthly", label: "Monthly" },
                      ]}
                      onChange={(v) =>
                        handleToggle("market_report_frequency", v)
                      }
                    />
                  )}
                  <Switch
                    id="market-report"
                    checked={prefs.market_report}
                    onCheckedChange={(checked) =>
                      handleToggle("market_report", checked)
                    }
                    size="sm"
                  />
                </div>
              </div>
            </div>

            {/* New listing alerts */}
            <div className="border-b border-neutral-100/60 dark:border-neutral-700/60">
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm font-medium text-foreground">
                    New Listing Alerts
                  </p>
                  <p className="font-body text-xs text-neutral-500">
                    Notifications when new properties matching your criteria are
                    listed.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {prefs.listing_alerts && (
                    <FrequencySelect
                      id="listing-alerts-frequency"
                      value={prefs.listing_alerts_frequency}
                      options={[
                        { value: "instant", label: "Instant" },
                        { value: "daily", label: "Daily digest" },
                        { value: "weekly", label: "Weekly digest" },
                      ]}
                      onChange={(v) =>
                        handleToggle("listing_alerts_frequency", v)
                      }
                    />
                  )}
                  <Switch
                    id="listing-alerts"
                    checked={prefs.listing_alerts}
                    onCheckedChange={(checked) =>
                      handleToggle("listing_alerts", checked)
                    }
                    size="sm"
                  />
                </div>
              </div>
            </div>

            {/* Price change alerts */}
            <div>
              <div className="flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm font-medium text-foreground">
                    Price Change Alerts
                  </p>
                  <p className="font-body text-xs text-neutral-500">
                    Email when a property on your watchlist has a price
                    reduction.
                  </p>
                </div>
                <Switch
                  id="price-change-alerts"
                  checked={prefs.price_change_alerts}
                  onCheckedChange={(checked) =>
                    handleToggle("price_change_alerts", checked)
                  }
                  size="sm"
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Promotional Emails */}
      <section className="space-y-4">
        <h3 className="font-heading text-base font-semibold text-foreground">
          Promotional Emails
        </h3>

        {loading ? (
          <div className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
            <SkeletonRow />
          </div>
        ) : (
          <div className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
            <div className="flex items-center justify-between p-4">
              <div className="min-w-0 flex-1">
                <p className="font-body text-sm font-medium text-foreground">
                  Promotional Offers
                </p>
                <p className="font-body text-xs text-neutral-500">
                  Special offers, partner deals, and platform feature
                  announcements.
                </p>
              </div>
              <Switch
                id="promotional-offers"
                checked={prefs.promotional_offers}
                onCheckedChange={(checked) =>
                  handleToggle("promotional_offers", checked)
                }
                size="sm"
              />
            </div>
          </div>
        )}
      </section>

      {/* System & Transactional — always on */}
      <section className="space-y-4">
        <h3 className="font-heading text-base font-semibold text-foreground">
          System & Transactional Emails
        </h3>

        <div className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 rounded-lg bg-info-light p-1.5 dark:bg-info/10">
              <Info className="size-4 text-info" />
            </div>
            <div>
              <p className="font-body text-sm font-medium text-foreground">
                Always enabled
              </p>
              <p className="mt-1 font-body text-xs text-neutral-500">
                Under GDPR, transactional and system emails cannot be turned
                off. These include booking confirmations, payment receipts,
                security alerts, and account notifications required for the
                proper functioning of the service.
              </p>
              <ul className="mt-2 list-inside list-disc space-y-0.5 font-body text-xs text-neutral-600 dark:text-neutral-400">
                <li>Booking & viewing confirmations</li>
                <li>Payment receipts and invoices</li>
                <li>Security alerts (password changes, new device logins)</li>
                <li>Account verification emails</li>
                <li>Legal notices and policy updates</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* GDPR Unsubscribe */}
      <section className="space-y-4">
        <h3 className="font-heading text-base font-semibold text-foreground">
          Marketing Preferences
        </h3>

        <div className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-900/20">
              <ShieldAlert className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="font-body text-sm font-medium text-foreground">
                  Unsubscribe from all marketing
                </p>
                <p className="mt-1 font-body text-xs text-neutral-500">
                  Under GDPR, you have the right to opt out of all marketing
                  communications at any time. This will disable all optional
                  email subscriptions above (property digest, market reports,
                  listing alerts, price changes, and promotional offers).
                </p>
              </div>
              <button
                type="button"
                onClick={handleUnsubscribeAll}
                className="rounded-lg border border-neutral-200 bg-card px-4 py-2 font-body text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-neutral-400/30 focus-visible:ring-offset-2"
              >
                Unsubscribe from all marketing emails
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Save CTA */}
      {!loading && (
        <div className="flex items-center justify-end gap-3">
          <p className="font-body text-xs text-neutral-400">
            Changes are saved when you click below.
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-brand-primary px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
          >
            {saving ? "Saving…" : "Save preferences"}
          </button>
        </div>
      )}
    </div>
  );
}
