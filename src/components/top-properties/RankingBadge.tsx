import { Award } from "lucide-react";

type Props = Readonly<{
  /** Category badge label, e.g. "Below local benchmark". */
  label: string;
  /** The real ranking reason, e.g. "12% below local benchmark". */
  reason: string;
}>;

/**
 * Ranking-reason badge. Icon + text (never colour alone) so the reason a
 * home ranks is readable by everyone.
 */
export function RankingBadge({ label, reason }: Props) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary-lighter px-2.5 py-1 text-xs font-semibold text-brand-primary"
      aria-label={`${label}: ${reason}`}
    >
      <Award className="size-3.5 shrink-0" aria-hidden="true" />
      {reason}
    </span>
  );
}
