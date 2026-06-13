import type { ConversionFunnel as ConversionFunnelType } from "@/types/provider-dashboard";

type Props = Readonly<{
  funnel: ConversionFunnelType;
}>;

type Stage = Readonly<{
  label: string;
  count: number;
  rate: string | null;
  colorClass: string;
  labelColorClass: string;
}>;

function calcRate(numerator: number, denominator: number): string | null {
  if (denominator === 0) return null;
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export function ConversionFunnel({ funnel }: Props) {
  const isEmpty = funnel.viewed === 0 && funnel.enquired === 0 && funnel.quoted === 0 && funnel.booked === 0;

  const stages: Stage[] = [
    {
      label: "Profile Views",
      count: funnel.viewed,
      rate: null,
      colorClass: "bg-neutral-200",
      labelColorClass: "text-neutral-600",
    },
    {
      label: "Enquiries",
      count: funnel.enquired,
      rate: calcRate(funnel.enquired, funnel.viewed),
      colorClass: "bg-[#d1e8e2]",
      labelColorClass: "text-brand-primary",
    },
    {
      label: "Quotes Sent",
      count: funnel.quoted,
      rate: calcRate(funnel.quoted, funnel.enquired),
      colorClass: "bg-brand-primary/60",
      labelColorClass: "text-white",
    },
    {
      label: "Bookings",
      count: funnel.booked,
      rate: calcRate(funnel.booked, funnel.quoted),
      colorClass: "bg-brand-primary",
      labelColorClass: "text-white",
    },
  ];

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-sm font-semibold text-neutral-700">Conversion Funnel</h3>

      {isEmpty ? (
        <div className="flex min-h-[120px] items-center justify-center text-sm text-neutral-400">
          Build your history to see conversion data
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-0">
          {stages.map((stage, index) => (
            <div key={stage.label} className="flex sm:flex-1 sm:flex-col">
              {/* Stage card */}
              <div
                className={`flex flex-1 flex-col items-center justify-center rounded-lg px-4 py-5 ${stage.colorClass} transition-opacity`}
              >
                <span
                  className={`text-3xl font-bold tabular-nums ${stage.labelColorClass}`}
                >
                  {stage.count.toLocaleString("en-GB")}
                </span>
                <span
                  className={`mt-1 text-xs font-medium ${stage.labelColorClass} opacity-90`}
                >
                  {stage.label}
                </span>
                {stage.rate !== null && (
                  <span
                    className={`mt-2 rounded-full px-2 py-0.5 text-xs font-semibold ${stage.labelColorClass} bg-black/10`}
                  >
                    {stage.rate} conversion
                  </span>
                )}
              </div>

              {/* Arrow connector between stages (desktop only) */}
              {index < stages.length - 1 && (
                <div className="hidden sm:flex sm:w-3 sm:items-center sm:justify-center">
                  <svg
                    viewBox="0 0 12 24"
                    className="h-6 w-3 fill-neutral-300"
                    aria-hidden="true"
                  >
                    <path d="M0 0 L12 12 L0 24 Z" />
                  </svg>
                </div>
              )}

              {/* Arrow connector (mobile only) */}
              {index < stages.length - 1 && (
                <div className="flex items-center justify-center py-1 sm:hidden">
                  <svg
                    viewBox="0 0 24 12"
                    className="h-3 w-6 fill-neutral-300"
                    aria-hidden="true"
                  >
                    <path d="M0 0 L24 0 L12 12 Z" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
