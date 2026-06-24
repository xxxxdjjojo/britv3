type ProgressBarProps = Readonly<{
  position: number;
  total: number;
}>;

const MIN_FILL = 4;
const MAX_FILL = 100;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function ProgressBar({ position, total }: ProgressBarProps) {
  const safeTotal = total > 0 ? total : 1;
  const fill = clamp((1 - position / safeTotal) * 100, MIN_FILL, MAX_FILL);
  const rounded = Math.round(fill);

  return (
    <div
      className="w-full"
      role="img"
      aria-label={`Position ${position.toLocaleString()} of ${total.toLocaleString()} on the waitlist`}
    >
      <div
        aria-hidden
        className="h-2 w-full overflow-hidden rounded-full bg-white/10"
      >
        <div
          className="h-full origin-left rounded-full bg-gradient-to-r from-[#FDCD74] to-[#f0b94e] transition-transform duration-700 ease-out"
          style={{ width: `${fill}%` }}
        />
      </div>
      <p className="mt-2 text-right text-xs text-white/45">
        {rounded}% to the front
      </p>
    </div>
  );
}
