import { formatGBP } from "@/lib/properties/rent-affordability-format";

const WEEKS_PER_MONTH = 52 / 12;

type Props = Readonly<{
  /** Main headline figure (monthly) */
  amount: number;
  /** Caption above the figure */
  eyebrow: string;
  /** Explanation under the figure */
  caption: string;
  /** Optional second-row stats shown on a divider */
  weekly?: boolean;
  footnote?: string;
}>;

export function ResultHeadlineCard({ amount, eyebrow, caption, weekly = true, footnote }: Props) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-primary p-8 text-white shadow-xl">
      <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary-foreground/70">
        {eyebrow}
      </p>
      <h3 className="text-5xl font-extrabold">
        {formatGBP(amount)}
        <span className="text-lg font-normal text-primary-foreground/70">/month</span>
      </h3>
      <p className="mt-3 text-sm text-primary-foreground/80">{caption}</p>
      {weekly && (
        <>
          <div className="mt-4 h-px w-full bg-white/10" />
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-sm text-primary-foreground/70">Weekly equivalent</p>
              <p className="text-xl font-bold">{formatGBP(amount / WEEKS_PER_MONTH)}</p>
            </div>
          </div>
        </>
      )}
      {footnote && <p className="mt-4 text-xs text-primary-foreground/60">{footnote}</p>}
    </div>
  );
}
