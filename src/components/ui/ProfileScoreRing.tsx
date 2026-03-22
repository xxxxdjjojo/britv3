import { cn } from "@/lib/utils";

function getColor(score: number): string {
  if (score >= 80) return "#059669"; // emerald-600
  if (score >= 60) return "#D4A853"; // gold
  if (score >= 40) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}

export function ProfileScoreRing(
  props: Readonly<{
    score: number;
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>,
) {
  const size = props.size ?? 120;
  const strokeWidth = props.strokeWidth ?? 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (props.score / 100) * circumference;
  const color = getColor(props.score);

  return (
    <div className={cn("relative inline-flex items-center justify-center", props.className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold" style={{ color }}>{props.score}</span>
        <span className="text-[10px] uppercase tracking-wider text-neutral-400">Score</span>
      </div>
    </div>
  );
}
