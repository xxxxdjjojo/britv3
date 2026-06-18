import type { ReactNode } from "react";

type Step = Readonly<{ title: string; body: ReactNode }>;

type NumberedStepsProps = Readonly<{ steps: readonly Step[] }>;

export function NumberedSteps({ steps }: NumberedStepsProps) {
  return (
    <ol className="not-prose space-y-6">
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-sm font-bold text-primary">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <p className="font-semibold text-neutral-900">{step.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
