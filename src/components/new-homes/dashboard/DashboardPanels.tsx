import { formatPercent } from "@/lib/new-homes/metrics";
import { formatGbp } from "@/lib/new-homes/format";
import type { ConversionMetrics } from "@/lib/new-homes/metrics";
import type { DevelopmentPerformance } from "@/lib/new-homes/metrics";
import type { DevelopmentViewing } from "@/lib/new-homes/types";

// --- KPI card ---------------------------------------------------------------

export function MetricCard({
  label,
  value,
  hint,
  accent = false,
}: Readonly<{
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}>) {
  return (
    <div
      className={
        "rounded-2xl border p-5 shadow-sm " +
        (accent
          ? "border-transparent bg-brand-primary text-white"
          : "border-neutral-200 bg-white")
      }
    >
      <p
        className={
          "text-xs font-semibold uppercase tracking-wide " +
          (accent ? "text-white/70" : "text-neutral-500")
        }
      >
        {label}
      </p>
      <p
        className={
          "mt-1 font-heading text-3xl font-bold " +
          (accent ? "text-white" : "text-neutral-900")
        }
      >
        {value}
      </p>
      {hint ? (
        <p className={"mt-1 text-xs " + (accent ? "text-white/70" : "text-neutral-400")}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

// --- conversion funnel ------------------------------------------------------

function FunnelRow({
  label,
  value,
  width,
}: Readonly<{ label: string; value: string; width: number }>) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-neutral-700">{label}</span>
        <span className="font-semibold text-neutral-900">{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-brand-primary transition-all"
          style={{ width: `${Math.max(2, Math.min(100, width))}%` }}
        />
      </div>
    </div>
  );
}

export function ConversionFunnel({
  metrics,
}: Readonly<{ metrics: ConversionMetrics }>) {
  const { totalEnquiries, viewingBookings, reservationRequests } = metrics;
  const pct = (n: number) => (totalEnquiries > 0 ? (n / totalEnquiries) * 100 : 0);
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 font-heading text-lg font-semibold text-neutral-900">
        Conversion funnel
      </h2>
      <p className="mb-5 text-sm text-neutral-500">
        From first enquiry to reservation — the demand we generate, measured.
      </p>
      <div className="space-y-4">
        <FunnelRow label="Enquiries" value={`${totalEnquiries}`} width={100} />
        <FunnelRow
          label="Viewings booked"
          value={`${viewingBookings} · ${formatPercent(metrics.enquiryToViewing)}`}
          width={pct(viewingBookings)}
        />
        <FunnelRow
          label="Reservations"
          value={`${reservationRequests} · ${formatPercent(metrics.enquiryToReservation)}`}
          width={pct(reservationRequests)}
        />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-neutral-100 pt-4 text-center">
        <div>
          <p className="font-heading text-lg font-bold text-brand-primary">
            {formatPercent(metrics.enquiryToViewing)}
          </p>
          <p className="text-[11px] text-neutral-500">Enquiry → viewing</p>
        </div>
        <div>
          <p className="font-heading text-lg font-bold text-brand-primary">
            {formatPercent(metrics.viewingToReservation)}
          </p>
          <p className="text-[11px] text-neutral-500">Viewing → reservation</p>
        </div>
        <div>
          <p className="font-heading text-lg font-bold text-brand-primary">
            {formatPercent(metrics.enquiryToReservation)}
          </p>
          <p className="text-[11px] text-neutral-500">Enquiry → reservation</p>
        </div>
      </div>
    </div>
  );
}

// --- top developments -------------------------------------------------------

export function TopDevelopments({
  rows,
}: Readonly<{ rows: DevelopmentPerformance[] }>) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-heading text-lg font-semibold text-neutral-900">
        Top performing developments
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">No developments yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.slice(0, 5).map((row, i) => (
            <li key={row.developmentId} className="flex items-center gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-500">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">{row.name}</p>
                <p className="text-xs text-neutral-500">
                  {row.enquiries} enquiries · {row.reservations} reservations
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-brand-primary">
                {formatPercent(row.enquiryToReservation)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// --- lead source + cost placeholder -----------------------------------------

export function SourceAndCost({
  metrics,
}: Readonly<{ metrics: ConversionMetrics }>) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-heading text-lg font-semibold text-neutral-900">
        Lead source & efficiency
      </h2>
      <dl className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-neutral-500">Top lead source</dt>
          <dd className="font-medium text-neutral-900">
            {metrics.topLeadSource ?? "Direct / organic"}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-neutral-500">Qualified enquiries</dt>
          <dd className="font-medium text-neutral-900">{metrics.qualifiedEnquiries}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-neutral-500">Cost per qualified enquiry</dt>
          <dd className="font-medium text-neutral-900">
            {metrics.costPerQualifiedEnquiry == null
              ? "—"
              : formatGbp(metrics.costPerQualifiedEnquiry)}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-[11px] text-neutral-400">
        Cost per enquiry appears once ad spend is connected. TrueDeed generates
        demand; you measure the return.
      </p>
    </div>
  );
}

// --- viewings list ----------------------------------------------------------

export function ViewingsList({
  viewings,
}: Readonly<{ viewings: DevelopmentViewing[] }>) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-heading text-lg font-semibold text-neutral-900">
        Viewings
      </h2>
      {viewings.length === 0 ? (
        <p className="text-sm text-neutral-500">No viewings requested yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {viewings.slice(0, 8).map((v) => (
            <li key={v.id} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <p className="font-medium text-neutral-800">
                  {v.scheduledFor
                    ? new Date(v.scheduledFor).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Date to confirm"}
                </p>
                {v.notes ? (
                  <p className="truncate text-xs text-neutral-500">{v.notes}</p>
                ) : null}
              </div>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium capitalize text-neutral-600">
                {v.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
