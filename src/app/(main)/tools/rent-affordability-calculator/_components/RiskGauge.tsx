import { Card, CardContent } from "@/components/ui/card";
import type { RiskBand } from "@/lib/properties/rent-affordability-advanced";
import { RISK_GAUGE_HEX, RISK_BADGE_CLASS, RISK_ICON } from "./risk-visuals";

type Props = Readonly<{
  /** Rent-to-income ratio as a percentage */
  ratio: number;
  band: RiskBand;
  /** True when the figure shown is the suggested max (no explicit rent entered) */
  usingSuggested: boolean;
}>;

const GAUGE_MAX = 50; // ratios above this still cap the ring at full

function Ring({ ratio, color }: { ratio: number; color: string }) {
  const size = 140;
  const strokeWidth = 12;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(Math.max(ratio, 0) / GAUGE_MAX, 1);
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className="stroke-muted"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{Math.round(ratio)}%</span>
        <span className="text-xs text-muted-foreground">of income</span>
      </div>
    </div>
  );
}

export function RiskGauge({ ratio, band, usingSuggested }: Props) {
  const Icon = RISK_ICON[band.id];
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-6 pt-6 sm:flex-row">
        <Ring ratio={ratio} color={RISK_GAUGE_HEX[band.id]} />
        <div className="flex-1 text-center sm:text-left">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm font-semibold ${RISK_BADGE_CLASS[band.id]}`}
          >
            <Icon className="size-4" />
            {band.label}
          </span>
          <p className="mt-2 text-sm text-muted-foreground">
            Rent-to-income ratio
          </p>
          <p className="text-xs text-muted-foreground">
            {usingSuggested
              ? "Based on your suggested maximum rent. Enter a rent you're considering to test a specific figure."
              : "Based on the rent you're considering."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
