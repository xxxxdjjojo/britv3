import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function WizardStepper(
  props: Readonly<{
    steps: string[];
    currentStep: number;
  }>,
) {
  const progressPct = Math.round(
    ((props.currentStep + 1) / props.steps.length) * 100,
  );

  return (
    <div className="space-y-4">
      {/* Progress bar — thin strip at top */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-brand-primary transition-all duration-500 ease-in-out"
          style={{ width: `${progressPct}%` }}
          aria-hidden="true"
        />
      </div>

      {/* Mobile: compact "Step N of M — Label" */}
      <p className="font-sans text-sm text-neutral-500 md:hidden">
        Step {props.currentStep + 1} of {props.steps.length} —{" "}
        <span className="font-semibold text-neutral-900">
          {props.steps[props.currentStep]}
        </span>
      </p>

      {/* Desktop: full numbered stepper */}
      <div className="hidden items-center md:flex">
        {props.steps.map((step, index) => {
          const isCompleted = index < props.currentStep;
          const isCurrent = index === props.currentStep;

          return (
            <div key={step} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                {/* Circle */}
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200",
                    isCompleted &&
                      "bg-brand-primary-lighter text-brand-primary",
                    isCurrent &&
                      "bg-brand-primary text-white shadow-md",
                    !isCompleted &&
                      !isCurrent &&
                      "bg-neutral-100 text-neutral-400",
                  )}
                  aria-label={
                    isCompleted
                      ? `${step} completed`
                      : isCurrent
                        ? `${step} current step`
                        : `${step} upcoming`
                  }
                >
                  {isCompleted ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {/* Label */}
                <span
                  className={cn(
                    "whitespace-nowrap font-sans text-xs",
                    isCurrent
                      ? "font-semibold text-neutral-900"
                      : isCompleted
                        ? "text-brand-primary"
                        : "text-neutral-400",
                  )}
                >
                  {step}
                </span>
              </div>

              {/* Connector line — not after last step */}
              {index < props.steps.length - 1 && (
                <div
                  className={cn(
                    "mb-5 h-0.5 flex-1 transition-colors duration-500",
                    index < props.currentStep
                      ? "bg-brand-primary"
                      : "bg-neutral-200",
                  )}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
