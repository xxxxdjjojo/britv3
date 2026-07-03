import type { Metadata } from "next";
import Link from "next/link";

import { ReportViewTracker } from "@/components/reports/ReportViewTracker";
import {
  MIN_RESOLVED_REPORTS,
  MIN_UPTIME_PROBES,
  SERIES_WINDOW_DAYS,
  getMetricsPageData,
  type MetricKey,
  type MetricSnapshot,
} from "@/services/metrics/platform-metrics-service";
import { TIME_TO_SELL_MIN_PAIRS } from "@/services/reports/time-to-sell-service";

import { MetricSparkline } from "./MetricSparkline";

/**
 * Open Metrics (/metrics) — Influence Strategy Phase 2, Campaign 44.
 *
 * Every number on this page is computed nightly from the same publicly
 * readable tables anyone can query (platform_metrics_daily, uptime_checks,
 * time_to_sell_snapshots). Definitions are VERSIONED: a definition change
 * gets a NEW metric key, never a silent redefinition of an existing one.
 */

export const revalidate = 3600;

/**
 * Version of the metric definitions below. Bump ONLY when adding new metric
 * keys — an existing key's definition never changes (that would be a silent
 * redefinition; retire the key and add a new one instead). Not exported:
 * Next.js page entries reject unknown named exports at build time.
 */
const METRIC_DEFINITIONS_VERSION = 1;
const DEFINITIONS_DATE = "2 July 2026";

const TITLE = "Open metrics";
const DESCRIPTION =
  "TrueDeed's platform numbers, published in the open: live listings, users, messages, valuations, moderation and uptime — with the exact definition behind every figure.";

export const metadata: Metadata = {
  title: `${TITLE} | TrueDeed`,
  description: DESCRIPTION,
  alternates: { canonical: "/metrics" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/metrics" },
};

/**
 * v1 metric definitions — displayed VERBATIM on each card. These strings are
 * the contract: what you read here is exactly what the nightly job counts.
 */
const METRIC_DEFINITIONS: Record<MetricKey, { label: string; definition: string }> = {
  active_sale_listings: {
    label: "Active sale listings",
    definition:
      "Active sale listings = listings with listing_type 'sale', status 'active' and not deleted, counted nightly.",
  },
  active_rent_listings: {
    label: "Active rental listings",
    definition:
      "Active rental listings = listings with listing_type 'rent', status 'active' and not deleted, counted nightly.",
  },
  registered_users: {
    label: "Registered users",
    definition: "Registered users = total user profiles ever created, counted nightly.",
  },
  messages_30d: {
    label: "Messages sent (30 days)",
    definition:
      "Messages (30 days) = messages sent between users in the trailing 30 days, counted nightly.",
  },
  valuations_generated: {
    label: "Valuations generated",
    definition:
      "Valuations generated = valuation sessions that reached a calculated result (status 'calculated' or 'claimed'), counted nightly.",
  },
  content_reports_open: {
    label: "Open moderation reports",
    definition: "Open moderation reports = content reports with status 'open', counted nightly.",
  },
  content_reports_resolved: {
    label: "Resolved moderation reports",
    definition:
      "Resolved moderation reports = content reports with status 'resolved', counted nightly.",
  },
};

const METRIC_ORDER: MetricKey[] = [
  "active_sale_listings",
  "active_rent_listings",
  "registered_users",
  "messages_30d",
  "valuations_generated",
  "content_reports_open",
  "content_reports_resolved",
];

function formatDay(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function CardShell({
  label,
  definition,
  children,
}: Readonly<{ label: string; definition: string; children: React.ReactNode }>) {
  return (
    <div className="flex flex-col rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-[0_2px_4px_-1px_rgba(27,77,62,0.05),0_16px_36px_-16px_rgba(27,77,62,0.20)]">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-primary">{label}</p>
      <div className="flex-1">{children}</div>
      <p className="mt-4 border-t border-brand-primary/10 pt-3 text-xs leading-relaxed text-neutral-500">
        <span className="font-semibold text-neutral-600">Definition (v{METRIC_DEFINITIONS_VERSION}):</span>{" "}
        {definition}
      </p>
    </div>
  );
}

function MetricCard({
  metricKey,
  snapshot,
}: Readonly<{ metricKey: MetricKey; snapshot: MetricSnapshot | undefined }>) {
  const { label, definition } = METRIC_DEFINITIONS[metricKey];

  if (!snapshot) {
    return (
      <CardShell label={label} definition={definition}>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          Awaiting the first nightly snapshot — this figure appears as soon as it has been counted.
          We never backfill or estimate.
        </p>
      </CardShell>
    );
  }

  return (
    <CardShell label={label} definition={definition}>
      <p className="mt-2 font-heading text-4xl font-extrabold tracking-tight text-brand-primary-dark">
        {snapshot.latestValue.toLocaleString("en-GB")}
      </p>
      <p className="mt-1 text-xs text-neutral-500">
        Counted {formatDay(snapshot.latestDay)} · tracked since {formatDay(snapshot.sinceDay)}
      </p>
      <MetricSparkline series={snapshot.series} label={`${label}, ${SERIES_WINDOW_DAYS}-day trend`} />
    </CardShell>
  );
}

export default async function OpenMetricsPage() {
  const data = await getMetricsPageData();
  const resolvedMeta = data.metrics.content_reports_resolved?.meta as
    | { median_resolution_hours?: number | null; resolved_sample_n?: number }
    | undefined;
  const medianResolutionHours = resolvedMeta?.median_resolution_hours ?? null;

  return (
    <article className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <ReportViewTracker report="open_metrics" />

      <header className="mb-14 max-w-3xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-primary">
          Open metrics
        </p>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
          Our numbers, in the open
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-neutral-600">
          The incumbents don&apos;t publish theirs. We publish ours nightly — small numbers included,
          because small-but-honest beats big-but-vague. Every figure carries its exact definition,
          and the tables behind this page are publicly readable, so anyone can check our maths.
        </p>
      </header>

      <section aria-labelledby="platform-metrics-heading">
        <h2 id="platform-metrics-heading" className="sr-only">
          Platform metrics
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {METRIC_ORDER.map((key) => (
            <MetricCard key={key} metricKey={key} snapshot={data.metrics[key]} />
          ))}

          {/* Moderation response time — gated on a disclosed minimum sample. */}
          <CardShell
            label="Median report resolution time"
            definition={`Median report resolution time = median of (resolved_at − created_at) across resolved content reports, published only once at least ${MIN_RESOLVED_REPORTS} reports have been resolved.`}
          >
            {medianResolutionHours !== null ? (
              <>
                <p className="mt-2 font-heading text-4xl font-extrabold tracking-tight text-brand-primary-dark">
                  {medianResolutionHours.toLocaleString("en-GB")} hrs
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Across {(resolvedMeta?.resolved_sample_n ?? 0).toLocaleString("en-GB")} resolved
                  reports
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                Not enough data yet — we publish this median only once at least{" "}
                {MIN_RESOLVED_REPORTS} reports have been resolved. No number is better than a shaky
                one.
              </p>
            )}
          </CardShell>

          {/* Time to sell — gated on matched-sale coverage (suppression flag). */}
          <CardShell
            label="Median days to sell"
            definition={`Median days to sell = median days from listing to Land Registry completion, computed only from confirmed matched sales (our listing ↔ HM Land Registry Price Paid pair), published only when the matched sample clears the disclosed threshold of ${TIME_TO_SELL_MIN_PAIRS} pairs.`}
          >
            {data.timeToSell && !data.timeToSell.suppressed && data.timeToSell.medianDays !== null ? (
              <>
                <p className="mt-2 font-heading text-4xl font-extrabold tracking-tight text-brand-primary-dark">
                  {data.timeToSell.medianDays.toLocaleString("en-GB")} days
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {data.timeToSell.period} · {data.timeToSell.sampleN.toLocaleString("en-GB")}{" "}
                  matched sales
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                Coming soon — arrives with matched-sale coverage. This figure unlocks once at least{" "}
                {TIME_TO_SELL_MIN_PAIRS} of our listings have been confirmed against HM Land Registry completions
                {data.timeToSell ? (
                  <> (currently {data.timeToSell.sampleN.toLocaleString("en-GB")})</>
                ) : null}
                . See <Link href="/reports/time-to-sell" className="underline decoration-brand-primary/40 underline-offset-2 hover:text-brand-primary">the Time-to-Sell tracker</Link>.
              </p>
            )}
          </CardShell>

          {/* Uptime — gated on a disclosed minimum probe count. */}
          <CardShell
            label={`Uptime (trailing ${SERIES_WINDOW_DAYS} days)`}
            definition={`Uptime = percentage of independent external probes of our public health endpoint (every 15 minutes, from GitHub's infrastructure — not ours) that got a healthy response in the trailing ${SERIES_WINDOW_DAYS} days, published only once at least ${MIN_UPTIME_PROBES} probes exist.`}
          >
            {data.uptime.availabilityPct !== null ? (
              <>
                <p className="mt-2 font-heading text-4xl font-extrabold tracking-tight text-brand-primary-dark">
                  {data.uptime.availabilityPct.toLocaleString("en-GB", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  %
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {data.uptime.okCount.toLocaleString("en-GB")} healthy of{" "}
                  {data.uptime.probeCount.toLocaleString("en-GB")} probes
                </p>
              </>
            ) : (
              <div className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-600">
                <p>
                  Not enough data yet — we publish the percentage only once at least{" "}
                  {MIN_UPTIME_PROBES} probes exist (currently{" "}
                  {data.uptime.probeCount.toLocaleString("en-GB")}). Until then, live status only:
                </p>
                {data.latestUptimeCheck ? (
                  <p className="font-medium text-neutral-900">
                    {data.latestUptimeCheck.ok ? "Up" : "Down"} as of the last probe
                    {data.latestUptimeCheck.latencyMs !== null
                      ? ` (${data.latestUptimeCheck.latencyMs.toLocaleString("en-GB")} ms)`
                      : ""}
                    .
                  </p>
                ) : (
                  <p className="font-medium text-neutral-900">No probes recorded yet.</p>
                )}
              </div>
            )}
          </CardShell>
        </div>
      </section>

      <footer className="mt-16 rounded-2xl border border-brand-primary/15 bg-brand-primary-lighter p-8">
        <h2 className="font-heading text-lg font-bold text-brand-primary-dark">
          Definitions v{METRIC_DEFINITIONS_VERSION} — {DEFINITIONS_DATE}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-700">
          Every metric&apos;s definition is fixed under this version. If a definition ever needs to
          change, it gets a <strong>new metric key</strong> and a version bump here — never a silent
          redefinition of an existing figure. Metrics whose nightly count fails are shown as gaps,
          not zeros, and gated metrics stay hidden until they clear their disclosed thresholds.
          Publishing these numbers is part of{" "}
          <Link
            href="/pledges"
            className="font-medium underline decoration-brand-primary/40 underline-offset-2 hover:text-brand-primary"
          >
            our public pledges
          </Link>
          .
        </p>
      </footer>
    </article>
  );
}
