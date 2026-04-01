
type SecurityScoreProps = Readonly<{
  hasPassword: boolean;
  hasMfa: boolean;
  hasConnectedAccount: boolean;
  recentPasswordChange: boolean;
}>;

const RING_SIZE = 48;
const STROKE_WIDTH = 4;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function scoreColor(pct: number): string {
  if (pct >= 75) return "text-success";
  if (pct >= 50) return "text-warning";
  return "text-error";
}

function strokeColor(pct: number): string {
  if (pct >= 75) return "stroke-success";
  if (pct >= 50) return "stroke-warning";
  return "stroke-error";
}

export function SecurityScoreBadge({
  hasPassword,
  hasMfa,
  hasConnectedAccount,
  recentPasswordChange,
}: SecurityScoreProps) {
  const factors = [hasPassword, hasMfa, hasConnectedAccount, recentPasswordChange];
  const score = factors.filter(Boolean).length * 25;
  const dashOffset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        className="shrink-0 -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          className="stroke-neutral-200 dark:stroke-neutral-700"
          strokeWidth={STROKE_WIDTH}
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          className={strokeColor(score)}
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="min-w-0">
        <p className={`font-heading text-lg font-bold leading-tight ${scoreColor(score)}`}>
          {score}%
        </p>
        <p className="font-body text-xs text-neutral-500">Security Score</p>
      </div>
    </div>
  );
}
