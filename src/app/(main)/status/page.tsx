import type { Metadata } from "next";
import Link from "next/link";

import {
  type ComponentState,
  type OverallState,
  type PublicComponent,
  type StatusPageData,
  getStatusPageData,
} from "@/services/status/status-page-service";

/**
 * Public status page (/status).
 *
 * Read-only, customer-facing view of live service health + trailing-window
 * uptime. All data comes through status-page-service, which strips every
 * internal detail (error strings, hostnames, raw latency) BEFORE it reaches
 * this component — this page renders only labels + coarse states. Referenced
 * from the error boundary (src/app/error.tsx) and the site footer.
 */

// Health pings are cached 30s upstream; re-render the page at most once a minute.
export const revalidate = 60;

const TITLE = "System status";
const DESCRIPTION =
  "Live status of TrueDeed's services — sign-in, payments, email and more — plus our recent uptime.";

export const metadata: Metadata = {
  title: `${TITLE} | TrueDeed`,
  description: DESCRIPTION,
  alternates: { canonical: "/status" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/status" },
};

const OVERALL_COPY: Record<OverallState, { headline: string; tone: ToneKey }> = {
  operational: { headline: "All systems operational", tone: "operational" },
  degraded: { headline: "Some systems are degraded", tone: "degraded" },
  outage: { headline: "We're experiencing an outage", tone: "outage" },
};

const COMPONENT_STATE_COPY: Record<ComponentState, { label: string; tone: ToneKey }> = {
  operational: { label: "Operational", tone: "operational" },
  degraded: { label: "Degraded", tone: "degraded" },
  down: { label: "Down", tone: "outage" },
};

type ToneKey = "operational" | "degraded" | "outage";

const TONE: Record<ToneKey, { text: string; bg: string; border: string; dot: string }> = {
  operational: {
    text: "text-emerald-800",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  degraded: {
    text: "text-amber-800",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  outage: {
    text: "text-red-800",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

function StatusPill({ tone, label }: Readonly<{ tone: ToneKey; label: string }>) {
  const t = TONE[tone];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${t.bg} ${t.border} ${t.text}`}
    >
      <span className={`size-2 rounded-full ${t.dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}

function ComponentRow({ component }: Readonly<{ component: PublicComponent }>) {
  const copy = COMPONENT_STATE_COPY[component.state];
  return (
    <li className="flex items-center justify-between gap-4 border-t border-brand-primary/10 py-4 first:border-t-0">
      <span className="font-medium text-neutral-900">{component.label}</span>
      <StatusPill tone={copy.tone} label={copy.label} />
    </li>
  );
}

function UptimeCard({ data }: Readonly<{ data: StatusPageData }>) {
  const { uptime, windowDays, minProbes, latestProbe } = data;
  return (
    <div className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-[0_2px_4px_-1px_rgba(27,77,62,0.05),0_16px_36px_-16px_rgba(27,77,62,0.20)]">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-primary">
        Uptime (trailing {windowDays} days)
      </p>
      {uptime.availabilityPct !== null ? (
        <>
          <p className="mt-2 font-heading text-4xl font-extrabold tracking-tight text-brand-primary-dark">
            {uptime.availabilityPct.toLocaleString("en-GB", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            %
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {uptime.okCount.toLocaleString("en-GB")} healthy of{" "}
            {uptime.probeCount.toLocaleString("en-GB")} external probes
          </p>
        </>
      ) : (
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-600">
          <p>
            We publish the percentage only once at least {minProbes} probes exist (currently{" "}
            {uptime.probeCount.toLocaleString("en-GB")}). Until then, live status only:
          </p>
          <p className="font-medium text-neutral-900">
            {latestProbe
              ? `${latestProbe.ok ? "Up" : "Down"} as of the last probe.`
              : "No probes recorded yet."}
          </p>
        </div>
      )}
      <p className="mt-4 border-t border-brand-primary/10 pt-3 text-xs leading-relaxed text-neutral-500">
        Probes run every 15 minutes from GitHub&apos;s infrastructure — independent of ours. See{" "}
        <Link
          href="/metrics"
          className="underline decoration-brand-primary/40 underline-offset-2 hover:text-brand-primary"
        >
          Open Metrics
        </Link>{" "}
        for the full definition.
      </p>
    </div>
  );
}

export default async function StatusPage() {
  const data = await getStatusPageData();
  const overall = OVERALL_COPY[data.overall];
  const tone = TONE[overall.tone];

  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 max-w-3xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-primary">
          System status
        </p>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
          Is TrueDeed working?
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-neutral-600">
          A live view of our services. If something you rely on is degraded or down, you&apos;ll
          see it here first.
        </p>
      </header>

      <section
        aria-labelledby="overall-heading"
        className={`mb-10 flex items-center gap-4 rounded-2xl border p-6 ${tone.bg} ${tone.border}`}
      >
        <span className={`size-4 shrink-0 rounded-full ${tone.dot}`} aria-hidden="true" />
        <div>
          <h2 id="overall-heading" className={`text-xl font-bold ${tone.text}`}>
            {overall.headline}
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            As of {formatTimestamp(data.generatedAt)}
          </p>
        </div>
      </section>

      <section aria-labelledby="components-heading" className="mb-10">
        <h2 id="components-heading" className="sr-only">
          Individual services
        </h2>
        <ul className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-[0_2px_4px_-1px_rgba(27,77,62,0.05),0_16px_36px_-16px_rgba(27,77,62,0.20)]">
          {data.components.map((component) => (
            <ComponentRow key={component.key} component={component} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="uptime-heading">
        <h2 id="uptime-heading" className="sr-only">
          Uptime
        </h2>
        <UptimeCard data={data} />
      </section>

      <footer className="mt-12 rounded-2xl border border-brand-primary/15 bg-brand-primary-lighter p-8">
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-700">
          Planned maintenance and past incidents will be published here. If you&apos;re seeing a
          problem that isn&apos;t reflected above, please{" "}
          <Link
            href="/help/contact"
            className="font-medium underline decoration-brand-primary/40 underline-offset-2 hover:text-brand-primary"
          >
            let us know
          </Link>
          .
        </p>
      </footer>
    </article>
  );
}
