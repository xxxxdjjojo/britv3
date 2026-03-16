"use client";

import { useEffect, useRef } from "react";

type TrustScoreGaugeProps = Readonly<{
  score: number; // 0–100
}>;

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

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

  const scoreColor =
    clampedScore >= 80
      ? "#1B4D3E"
      : clampedScore >= 50
        ? "#CA8A04"
        : "#DC2626";

  return (
    <div className="flex flex-col items-center gap-4">
      {/* SVG gauge */}
      <div className="relative inline-flex items-center justify-center">
        <svg
          width="140"
          height="140"
          viewBox="0 0 140 140"
          aria-label={`Trust score: ${clampedScore}%`}
          role="img"
        >
          {/* Track */}
          <circle
            cx="70"
            cy="70"
            r={RADIUS}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
          />
          {/* Filled arc */}
          <circle
            ref={arcRef}
            cx="70"
            cy="70"
            r={RADIUS}
            fill="none"
            stroke={scoreColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE - (clampedScore / 100) * CIRCUMFERENCE}
            transform="rotate(-90 70 70)"
          />
        </svg>
        {/* Centre text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-black leading-none"
            style={{ color: scoreColor }}
          >
            {clampedScore}
          </span>
          <span className="text-xs font-semibold text-neutral-500">/ 100</span>
        </div>
      </div>

      {/* Label + description */}
      <div className="text-center">
        <p className="text-sm font-semibold text-neutral-900">Trust Score</p>
        <p className="mt-0.5 text-xs text-neutral-500">
          {clampedScore >= 80
            ? "Excellent — you unlock premium placement"
            : clampedScore >= 50
              ? "Good — complete remaining steps to improve"
              : "Complete your profile to build trust"}
        </p>
      </div>
    </div>
  );
}
