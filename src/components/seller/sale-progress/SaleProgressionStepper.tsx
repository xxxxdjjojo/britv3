
import { Check, Loader2 } from "lucide-react";
import type { SaleProgressionStage, SaleStageNumber } from "@/types/seller";
import { cn } from "@/lib/utils";

const STAGE_CONFIG: Record<
  SaleStageNumber,
  { label: string; shortLabel: string }
> = {
  1: { label: "Offer Accepted", shortLabel: "Listed" },
  2: { label: "Solicitors Instructed", shortLabel: "Solicitors" },
  3: { label: "Searches Ordered", shortLabel: "Searches" },
  4: { label: "Survey Completed", shortLabel: "Survey" },
  5: { label: "Mortgage Offer", shortLabel: "Mortgage" },
  6: { label: "Contracts Signed", shortLabel: "Exchange" },
  7: { label: "Exchange", shortLabel: "Exchange" },
  8: { label: "Completion", shortLabel: "Completion" },
};

type Props = Readonly<{
  progression: SaleProgressionStage;
}>;

export function SaleProgressionStepper({ progression }: Props) {
  const current = progression.current_stage;
  // Progress bar width: based on completed stages out of total gaps
  const progressPct = Math.max(0, ((current - 1) / 7) * 100);

  return (
    <div className="relative py-4">
      {/* Track line */}
      <div className="absolute top-[2.25rem] left-4 right-4 h-1 bg-stone-100 z-0" />
      <div
        className="absolute top-[2.25rem] left-4 h-1 bg-emerald-600 z-0 transition-all duration-700"
        style={{
          width: `calc(${progressPct}% * (100% - 2rem) / 100%)`,
        }}
      />

      {/* Stage nodes */}
      <div className="relative z-10 flex justify-between items-start px-0">
        {Array.from({ length: 8 }, (_, i) => (i + 1) as SaleStageNumber).map(
          (stage) => {
            const isCompleted = stage < current;
            const isCurrent = stage === current;
            const isFuture = stage > current;
            const completedDate = progression.stage_dates[String(stage)];
            const expectedDate = progression.expected_dates[String(stage)];
            const config = STAGE_CONFIG[stage];

            return (
              <div
                key={stage}
                className={cn(
                  "flex flex-col items-center gap-2",
                  isCurrent && "scale-110",
                  isFuture && "opacity-40",
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center transition-all duration-300",
                    isCurrent
                      ? "w-10 h-10 rounded-full bg-white border-4 border-emerald-600 text-emerald-600 shadow-xl"
                      : isCompleted
                        ? "w-8 h-8 rounded-full bg-emerald-600 text-white shadow-lg"
                        : "w-8 h-8 rounded-full bg-stone-200 text-stone-500",
                  )}
                >
                  {isCompleted ? (
                    <Check
                      size={isCurrent ? 18 : 15}
                      strokeWidth={2.5}
                      className="text-white"
                    />
                  ) : isCurrent ? (
                    <Loader2
                      size={18}
                      strokeWidth={2}
                      className="text-emerald-600 animate-spin"
                    />
                  ) : (
                    <span className="text-xs font-bold">{stage}</span>
                  )}
                </div>

                <p
                  className={cn(
                    "text-center leading-tight max-w-[72px]",
                    isCurrent
                      ? "text-[11px] font-bold text-emerald-900"
                      : isCompleted
                        ? "text-[10px] font-bold text-stone-400"
                        : "text-[10px] font-bold text-stone-400",
                  )}
                >
                  {config.shortLabel}
                </p>

                {completedDate ? (
                  <p className="text-[9px] text-stone-400">
                    {new Date(completedDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                ) : expectedDate && isCurrent ? (
                  <p className="text-[9px] text-emerald-600/70">
                    Est.{" "}
                    {new Date(expectedDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                ) : null}
              </div>
            );
          },
        )}
      </div>

      {/* Current stage detail */}
      <div className="mt-8 bg-emerald-50/50 rounded-2xl border-2 border-emerald-600 p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
              <Loader2 size={18} strokeWidth={2} className="animate-spin" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-tighter">
                Current Stage
              </p>
              <h3 className="font-bold text-emerald-900">
                {current}. {STAGE_CONFIG[current].label}
              </h3>
            </div>
          </div>
          {progression.expected_dates[String(current)] && (
            <div className="text-right">
              <p className="text-xs text-stone-400">Est. Completion</p>
              <p className="text-sm font-bold text-emerald-900">
                {new Date(
                  progression.expected_dates[String(current)],
                ).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
        </div>
        {progression.notes && (
          <p className="text-sm text-stone-500 mt-3 leading-relaxed border-t border-emerald-100 pt-3">
            {progression.notes}
          </p>
        )}
      </div>
    </div>
  );
}
