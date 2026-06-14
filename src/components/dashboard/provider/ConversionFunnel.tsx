import type { ConversionFunnel as ConversionFunnelType } from "@/types/provider-dashboard";

type Props = Readonly<{
  funnel: ConversionFunnelType;
}>;

type Stage = Readonly<{
  label: string;
  count: number;
  rate: string | null;
  /** bg token for the stage bar fill */
  barClass: string;
}>;

function calcRate(numerator: number, denominator: number): string | null {
  if (denominator === 0) return null;
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export function ConversionFunnel({ funnel }: Props) {
  const isEmpty =
    funnel.viewed === 0 &&
    funnel.enquired === 0 &&
    funnel.quoted === 0 &&
    funnel.booked === 0;

  const stages: Stage[] = [
    {
      label: "Profile Views",
      count: funnel.viewed,
      rate: null,
      barClass: "bg-neutral-300",
    },
    {
      label: "Enquiries",
      count: funnel.enquired,
      rate: calcRate(funnel.enquired, funnel.viewed),
      barClass: "bg-brand-primary/40",
    },
    {
      label: "Quotes Sent",
      count: funnel.quoted,
      rate: calcRate(funnel.quoted, funnel.enquired),
      barClass: "bg-brand-primary/70",
    },
    {
      label: "Bookings",
      count: funnel.booked,
      rate: calcRate(funnel.booked, funnel.quoted),
      barClass: "bg-brand-primary",
    },
  ];

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-sm font-semibold text-neutral-800">Conversion Funnel</h3>

      {isEmpty ? (
        <div className="flex min-h-[120px] items-center justify-center text-sm text-neutral-400">
          Build your history to see conversion data
        </div>
      ) : (
        <>
          {/* Desktop: horizontal stages */}
          <div className="hidden gap-0 sm:flex sm:items-stretch">
            {stages.map((stage, index) => {
              const widthPct = Math.round((stage.count / maxCount) * 100);
              return (
                <div key={stage.label} className="flex flex-1 flex-col">
                  <div className="flex flex-1 flex-col items-center justify-center px-3 py-5">
                    <span className="text-2xl font-bold tabular-nums text-brand-primary-dark">
                      {stage.count.toLocaleString("en-GB")}
                    </span>
                    <span className="mt-1 text-xs font-medium text-neutral-500">
                      {stage.label}
                    </span>
                    {stage.rate !== null && (
                      <span className="mt-2 rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs font-semibold text-brand-primary">
                        {stage.rate} conv.
                      </span>
                    )}
                  </div>
                  {/* Bar */}
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className={`h-full rounded-full transition-all ${stage.barClass}`}
                      style={{ width: `${widthPct}%` }}
                      aria-label={`${stage.label}: ${widthPct}% relative`}
                    />
                  </div>
                  {/* Arrow connector */}
                  {index < stages.length - 1 && (
                    <div className="pointer-events-none absolute" aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile: vertical list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {stages.map((stage) => {
              const widthPct = Math.round((stage.count / maxCount) * 100);
              return (
                <div key={stage.label}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-700">{stage.label}</span>
                    <div className="flex items-center gap-2">
                      {stage.rate !== null && (
                        <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs font-semibold text-brand-primary">
                          {stage.rate}
                        </span>
                      )}
                      <span className="text-sm font-bold tabular-nums text-brand-primary-dark">
                        {stage.count.toLocaleString("en-GB")}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className={`h-full rounded-full transition-all ${stage.barClass}`}
                      style={{ width: `${widthPct}%` }}
                      aria-label={`${stage.label}: ${widthPct}% relative`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
