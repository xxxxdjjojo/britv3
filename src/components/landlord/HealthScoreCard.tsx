import Link from "next/link";
import {
  ShieldCheck,
  PoundSterling,
  Wrench,
  Landmark,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HealthScore } from "@/services/landlord/portfolio-service";

type HealthScoreCardProps = Readonly<{
  score: HealthScore;
}>;

const WEAKEST_AREA_CONFIG = {
  compliance: {
    label: "Compliance",
    href: "/dashboard/landlord/compliance",
    tip: "Review expired or expiring certificates",
  },
  rent: {
    label: "Rent Collection",
    href: "/dashboard/landlord/rent",
    tip: "Log outstanding rent payments",
  },
  maintenance: {
    label: "Maintenance",
    href: "/dashboard/landlord/maintenance",
    tip: "Respond to open maintenance requests",
  },
  deposits: {
    label: "Deposit Registration",
    href: "/dashboard/landlord/tenancies",
    tip: "Register deposits with a protection scheme",
  },
} as const;

function getScoreColor(score: number): string {
  if (score > 75) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

function getStrokeColor(score: number): string {
  if (score > 75) return "stroke-emerald-500";
  if (score >= 50) return "stroke-amber-500";
  return "stroke-red-500";
}

function getTrackColor(score: number): string {
  if (score > 75) return "stroke-emerald-100 dark:stroke-emerald-900/30";
  if (score >= 50) return "stroke-amber-100 dark:stroke-amber-900/30";
  return "stroke-red-100 dark:stroke-red-900/30";
}

function ScoreRing({ score }: Readonly<{ score: number }>) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="size-36 -rotate-90" viewBox="0 0 120 120">
        {/* Track */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="8"
          className={getTrackColor(score)}
        />
        {/* Progress */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-700", getStrokeColor(score))}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className={cn(
            "text-4xl font-black tracking-tight",
            getScoreColor(score),
          )}
        >
          {score}
        </span>
        <span className="text-xs font-medium text-slate-400">/ 100</span>
      </div>
    </div>
  );
}

type SubScoreRowProps = Readonly<{
  icon: React.ElementType;
  label: string;
  score: number;
  max: number;
}>;

function SubScoreRow({ icon: Icon, label, score, max }: SubScoreRowProps) {
  const pct = max > 0 ? (score / max) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <Icon className="size-4 shrink-0 text-slate-400" />
      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {label}
          </span>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {score}/{max}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted dark:bg-slate-800">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              pct > 75
                ? "bg-emerald-500"
                : pct >= 50
                  ? "bg-amber-500"
                  : "bg-red-500",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function HealthScoreCard({ score }: HealthScoreCardProps) {
  const weakest = WEAKEST_AREA_CONFIG[score.weakest_area];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Property Health Score
        </h3>
        <span
          className={cn(
            "rounded-lg px-2 py-0.5 text-xs font-bold",
            score.total_score > 75
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
              : score.total_score >= 50
                ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
          )}
        >
          {score.total_score > 75
            ? "Healthy"
            : score.total_score >= 50
              ? "Needs Attention"
              : "At Risk"}
        </span>
      </div>

      {/* Score Ring */}
      <div className="flex justify-center py-4">
        <ScoreRing score={score.total_score} />
      </div>

      {/* Sub-scores */}
      <div className="space-y-3">
        <SubScoreRow
          icon={ShieldCheck}
          label="Compliance"
          score={score.compliance_score}
          max={score.compliance_max}
        />
        <SubScoreRow
          icon={PoundSterling}
          label="Rent Collection"
          score={score.rent_score}
          max={score.rent_max}
        />
        <SubScoreRow
          icon={Wrench}
          label="Maintenance Response"
          score={score.maintenance_score}
          max={score.maintenance_max}
        />
        <SubScoreRow
          icon={Landmark}
          label="Deposit Registration"
          score={score.deposit_score}
          max={score.deposit_max}
        />
      </div>

      {/* Weakest area callout */}
      {score.total_score < 100 && (
        <Link
          href={weakest.href}
          className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 bg-surface px-4 py-3 transition-colors hover:border-brand-primary/20 hover:bg-brand-primary/5 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-brand-primary/40"
        >
          <div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Improve: {weakest.label}
            </p>
            <p className="text-xs text-slate-400">{weakest.tip}</p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-brand-primary" />
        </Link>
      )}
    </div>
  );
}
