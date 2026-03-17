"use client";

import Link from "next/link";
import { Check, X, ShieldCheck } from "lucide-react";

type SecurityFactor = Readonly<{
  label: string;
  completed: boolean;
}>;

type SecurityScoreBadgeProps = Readonly<{
  score: number;
  total: number;
}>;

function getScoreColor(score: number): string {
  if (score <= 1) return "text-red-500";
  if (score === 2) return "text-amber-500";
  return "text-green-500";
}

function getStrokeColor(score: number): string {
  if (score <= 1) return "stroke-red-500";
  if (score === 2) return "stroke-amber-500";
  return "stroke-green-500";
}

function getScoreLabel(score: number, total: number): string {
  if (score === total) return "Excellent";
  if (score >= 3) return "Strong";
  if (score === 2) return "Fair";
  return "Weak";
}

const FACTORS: readonly SecurityFactor[] = [
  { label: "Password set", completed: true },
  { label: "2FA enabled", completed: false },
  { label: "Sessions reviewed", completed: true },
  { label: "Connected accounts", completed: false },
];

export function SecurityScoreBadge({ score, total }: SecurityScoreBadgeProps) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / total) * circumference;
  const offset = circumference - progress;

  return (
    <Link
      href="/settings/security"
      className="block rounded-lg border border-neutral-200 p-4 transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800/50"
    >
      <div className="flex items-center gap-3">
        {/* SVG progress ring */}
        <div className="relative flex size-12 shrink-0 items-center justify-center">
          <svg className="size-12 -rotate-90" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r={radius}
              fill="none"
              strokeWidth="3"
              className="stroke-neutral-200 dark:stroke-neutral-700"
            />
            <circle
              cx="24"
              cy="24"
              r={radius}
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={getStrokeColor(score)}
            />
          </svg>
          <span className={`absolute font-body text-xs font-bold ${getScoreColor(score)}`}>
            {score}/{total}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className={`size-4 ${getScoreColor(score)}`} />
            <span className="font-heading text-sm font-semibold text-neutral-900 dark:text-white">
              Security: {getScoreLabel(score, total)}
            </span>
          </div>
          <p className="mt-0.5 font-body text-xs text-neutral-500">
            {score === total
              ? "All checks passed"
              : `${total - score} action${total - score > 1 ? "s" : ""} recommended`}
          </p>
        </div>
      </div>

      {/* Factor checklist */}
      <ul className="mt-3 space-y-1">
        {FACTORS.map((factor) => (
          <li key={factor.label} className="flex items-center gap-2">
            {factor.completed ? (
              <Check className="size-3.5 text-green-500" />
            ) : (
              <X className="size-3.5 text-neutral-400" />
            )}
            <span
              className={`font-body text-xs ${
                factor.completed
                  ? "text-neutral-700 dark:text-neutral-300"
                  : "text-neutral-400"
              }`}
            >
              {factor.label}
            </span>
          </li>
        ))}
      </ul>
    </Link>
  );
}
