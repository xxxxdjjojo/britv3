
import { CheckCircle, Loader2 } from "lucide-react";
import type { SaleProgressionStage, SaleStageNumber } from "@/types/seller";
import { cn } from "@/lib/utils";

const STAGE_LABELS: Record<SaleStageNumber, string> = {
  1: "Offer Accepted",
  2: "Solicitors Instructed",
  3: "Searches Ordered",
  4: "Survey Completed",
  5: "Mortgage Offer",
  6: "Contracts Signed",
  7: "Exchange",
  8: "Completion",
};

type Props = Readonly<{
  progression: SaleProgressionStage;
}>;

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function daysColor(days: number): string {
  if (days < 7) return "bg-red-100 text-red-700";
  if (days < 14) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

function ExpectedDateBadge({
  expectedDate,
}: Readonly<{ expectedDate: string }>) {
  const days = daysUntil(expectedDate);
  return (
    <>
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-[#1B4D3E]/20 text-[#1B4D3E]">
        By{" "}
        {new Date(expectedDate).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })}
      </span>
      <span
        className={cn(
          "text-xs font-semibold px-2.5 py-1 rounded-full",
          daysColor(days),
        )}
      >
        {days > 0 ? `${days} days` : "Overdue"}
      </span>
    </>
  );
}

export function SaleProgressionStepper({ progression }: Props) {
  const current = progression.current_stage;
  const progressPct = Math.max(0, ((current - 1) / 7) * 100);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="font-semibold text-slate-900 mb-6 font-['Plus_Jakarta_Sans']">
        Sale Progress
      </h2>

      <div className="relative">
        {/* Progress track */}
        <div className="absolute top-5 left-5 right-5 h-1 bg-slate-100 rounded-full z-0">
          <div
            className="h-full bg-[#1B4D3E] rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Stage nodes */}
        <div className="relative z-10 grid grid-cols-8 gap-0">
          {(
            Array.from(
              { length: 8 },
              (_, i) => (i + 1) as SaleStageNumber,
            )
          ).map((stage) => {
            const isCompleted = stage < current;
            const isCurrent = stage === current;
            const isFuture = stage > current;
            const completedDate = progression.stage_dates[String(stage)];
            const expectedDate = progression.expected_dates[String(stage)];

            return (
              <div key={stage} className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300",
                    isCompleted && "bg-emerald-500",
                    isCurrent && "bg-[#1B4D3E] ring-4 ring-[#1B4D3E]/20",
                    isFuture && "bg-slate-200 opacity-40",
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle size={20} className="text-white" />
                  ) : isCurrent ? (
                    <Loader2 size={16} className="text-white animate-spin" />
                  ) : (
                    <span className="text-xs font-bold text-slate-400">
                      {stage}
                    </span>
                  )}
                </div>

                <p
                  className={cn(
                    "text-center text-[10px] font-medium leading-tight max-w-[70px]",
                    isCompleted && "text-emerald-700",
                    isCurrent && "text-[#1B4D3E] font-bold",
                    isFuture && "text-slate-400",
                  )}
                >
                  {STAGE_LABELS[stage]}
                </p>

                {completedDate ? (
                  <p className="text-[9px] text-slate-400">
                    {new Date(completedDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                ) : expectedDate && isCurrent ? (
                  <p className="text-[9px] text-[#1B4D3E]/70">
                    Est.{" "}
                    {new Date(expectedDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current stage detail card */}
      <div className="mt-8 bg-[#1B4D3E]/5 border border-[#1B4D3E]/20 rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-[#1B4D3E]/60 uppercase tracking-wide">
              Current Stage
            </p>
            <h3 className="text-lg font-bold text-[#1B4D3E] mt-1">
              {STAGE_LABELS[current]}
            </h3>
          </div>
          <div className="flex gap-2">
            {progression.expected_dates[String(current)] && (
              <ExpectedDateBadge
                expectedDate={progression.expected_dates[String(current)]}
              />
            )}
          </div>
        </div>
        {progression.notes && (
          <p className="text-sm text-slate-600 mt-3">{progression.notes}</p>
        )}
      </div>
    </div>
  );
}
