import type { ReactNode } from "react";

const STEPS = ["Address", "Details", "Review", "Verify"] as const;

type Props = {
  current: 1 | 2 | 3 | 4;
  title: string;
  description?: string;
  children: ReactNode;
};

/** Shared layout + progress indicator for the valuation journey steps. */
export function StepShell({ current, title, description, children }: Props) {
  const pct = Math.round((current / STEPS.length) * 100);
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <nav aria-label="Progress" className="mb-8">
        <p className="mb-2 text-sm font-medium text-neutral-600">
          Step {current} of {STEPS.length}: {STEPS[current - 1]}
        </p>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-neutral-200"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Valuation progress: ${pct}%`}
        >
          <div
            className="h-full rounded-full bg-brand-primary transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </nav>

      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 text-neutral-600">{description}</p> : null}
      </header>

      {children}
    </div>
  );
}
