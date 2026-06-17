"use client";

import { useEffect, useRef } from "react";

type TrustScoreGaugeProps = Readonly<{
  score: number; // 0–100
}>;

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Map score to a CSS custom-property-backed color token class. */
function scoreColorVar(score: number): string {
  if (score >= 80) return "var(--color-brand-primary)";
  if (score >= 50) return "var(--color-warning)";
  return "var(--color-error)";
}

/** Human-readable tier label for the score band. */
function scoreTierLabel(score: number): string {
  if (score >= 80) return "Excellent — you unlock premium placement";
  if (score >= 50) return "Good — complete remaining steps to improve";
  return "Complete your profile to build trust";
}

/** Tailwind text-color class for the centre numeral (no inline hex). */
function scoreTierTextClass(score: number): string {
  if (score >= 80) return "text-brand-primary";
  if (score >= 50) return "text-warning";
  return "text-error";
}

export function TrustScoreGauge({ score }: TrustScoreGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const arcRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const el = arcRef.current;
    if (!el) return;

    // Start from full offset (empty) and animate to the final offset
    const targetOffset = CIRCUMFERENCE - (clampedScore / 100) * CIRCUMFERENCE;
    el.style.strokeDashoffset = String(CIRCUMFERENCE);

    const raf = requestAnimationFrame(() => {
      el.style.transition = "stroke-dashoffset 1s ease-out";
      el.style.strokeDashoffset = String(targetOffset);
    });

    return () => cancelAnimationFrame(raf);
  }, [clampedScore]);

  const arcColor = scoreColorVar(clampedScore);
  const textClass = scoreTierTextClass(clampedScore);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Section label */}
      <p className="self-start text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
        Trust Score
      </p>

      {/* SVG gauge */}
      <div className="relative inline-flex items-center justify-center">
        <svg
          width="140"
          height="140"
          viewBox="0 0 140 140"
          aria-label={`Trust score: ${clampedScore} out of 100`}
          role="img"
        >
          {/* Track */}
          <circle
            cx="70"
            cy="70"
            r={RADIUS}
            fill="none"
            stroke="var(--color-neutral-200)"
            strokeWidth="12"
          />
          {/* Filled arc */}
          <circle
            ref={arcRef}
            cx="70"
            cy="70"
            r={RADIUS}
            fill="none"
            stroke={arcColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE - (clampedScore / 100) * CIRCUMFERENCE}
            transform="rotate(-90 70 70)"
          />
        </svg>
        {/* Centre text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={["text-3xl font-black leading-none", textClass].join(" ")}>
            {clampedScore}
          </span>
          <span className="text-xs font-semibold text-neutral-500">/ 100</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-center text-xs text-neutral-500">
        {scoreTierLabel(clampedScore)}
      </p>
    </div>
  );
}
