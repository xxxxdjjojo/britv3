import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function WizardStepper(
  props: Readonly<{
    steps: string[];
    currentStep: number;
  }>,
) {
  return (
    <>
      {/* Mobile: compact text */}
      <p className="font-body text-sm text-neutral-500 md:hidden">
        Step {props.currentStep + 1} of {props.steps.length} —{" "}
        <span className="font-medium text-neutral-900">
          {props.steps[props.currentStep]}
        </span>
      </p>

      {/* Desktop: full stepper */}
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
                    "flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    isCompleted &&
                      "border-brand-primary bg-brand-primary text-white",
                    isCurrent &&
                      "border-brand-primary bg-brand-primary text-white",
                    !isCompleted &&
                      !isCurrent &&
                      "border-neutral-300 bg-white text-neutral-400",
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {/* Label */}
                <span
                  className={cn(
                    "whitespace-nowrap font-body text-xs",
                    isCurrent
                      ? "font-medium text-neutral-900"
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
                    "mb-5 h-0.5 flex-1 transition-colors",
                    index < props.currentStep
                      ? "bg-brand-primary"
                      : "bg-neutral-200",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
