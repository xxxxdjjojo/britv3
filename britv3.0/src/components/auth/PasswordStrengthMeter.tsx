"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

type StrengthLevel = "weak" | "fair" | "good" | "strong";

const requirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const strengthColors: Record<StrengthLevel, string> = {
  weak: "bg-error",
  fair: "bg-warning",
  good: "bg-success",
  strong: "bg-brand-primary",
};

const strengthLabels: Record<StrengthLevel, string> = {
  weak: "Weak",
  fair: "Fair",
  good: "Good",
  strong: "Strong",
};

function getStrength(password: string): { level: StrengthLevel; score: number } {
  const score = requirements.filter((r) => r.test(password)).length;
  if (score <= 1) return { level: "weak", score };
  if (score === 2) return { level: "fair", score };
  if (score === 3) return { level: "good", score };
  return { level: "strong", score };
}

export function PasswordStrengthMeter(
  props: Readonly<{ password: string }>,
) {
  const { password } = props;
  const { level, score } = useMemo(() => getStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-3">
      {/* Strength Bar */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < score ? strengthColors[level] : "bg-neutral-200",
              )}
            />
          ))}
        </div>
        <span
          className={cn(
            "text-xs font-medium",
            level === "weak" && "text-error",
            level === "fair" && "text-warning",
            level === "good" && "text-success",
            level === "strong" && "text-brand-primary",
          )}
        >
          {strengthLabels[level]}
        </span>
      </div>

      {/* Requirements Checklist */}
      <ul className="space-y-1">
        {requirements.map((req) => {
          const met = req.test(password);
          return (
            <li key={req.label} className="flex items-center gap-2 text-xs">
              {met ? (
                <Check className="size-3.5 text-success" />
              ) : (
                <X className="size-3.5 text-neutral-400" />
              )}
              <span className={met ? "text-neutral-700" : "text-neutral-400"}>
                {req.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
