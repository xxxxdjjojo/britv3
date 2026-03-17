import Link from "next/link";
import { Check } from "lucide-react";
import type { VerificationStep } from "@/services/provider/provider-verification-service";

const STEP_LINKS: Record<string, string> = {
  id_check: "/dashboard/provider/verification/credentials",
  insurance: "/dashboard/provider/verification/credentials",
  qualifications: "/dashboard/provider/verification/credentials",
  client_references: "/dashboard/provider/verification/references/client",
  peer_references: "/dashboard/provider/verification/references/peer",
};

const STATUS_LABEL: Record<VerificationStep["status"], string> = {
  not_started: "Not started",
  in_progress: "In progress",
  submitted: "Under review",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_BADGE_CLASS: Record<VerificationStep["status"], string> = {
  not_started: "bg-neutral-100 text-neutral-500",
  in_progress: "bg-[#FEF9C3] text-[#CA8A04]",
  submitted: "bg-blue-50 text-blue-600",
  approved: "bg-[#DCFCE7] text-[#16A34A]",
  rejected: "bg-red-50 text-red-600",
};

type VerificationStepperProps = Readonly<{
  steps: VerificationStep[];
}>;

export function VerificationStepper({ steps }: VerificationStepperProps) {
  return (
    <ol className="relative space-y-0">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const isApproved = step.status === "approved";
        const isInProgress = step.status === "in_progress" || step.status === "submitted";
        const href = STEP_LINKS[step.stepId] ?? "/dashboard/provider/verification";

        return (
          <li key={step.stepId} className="relative flex gap-4">
            {/* Vertical connecting line */}
            {!isLast && (
              <div
                aria-hidden="true"
                className="absolute left-[19px] top-10 bottom-0 w-px bg-neutral-200"
              />
            )}

            {/* Circle indicator */}
            <div className="relative z-10 flex shrink-0 items-start pt-0.5">
              {isApproved ? (
                <div className="flex size-10 items-center justify-center rounded-full bg-[#1B4D3E]">
                  <Check className="size-5 text-white" strokeWidth={2.5} />
                </div>
              ) : isInProgress ? (
                <div className="flex size-10 items-center justify-center rounded-full border-2 border-dashed border-[#1B4D3E] bg-white">
                  <span className="text-xs font-bold text-[#1B4D3E]">{step.step_number}</span>
                </div>
              ) : (
                <div className="flex size-10 items-center justify-center rounded-full border-2 border-neutral-300 bg-white">
                  <span className="text-xs font-medium text-neutral-400">{step.step_number}</span>
                </div>
              )}
            </div>

            {/* Step content */}
            <div className="flex-1 pb-8">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={[
                    "text-sm font-semibold",
                    isApproved ? "text-[#1B4D3E]" : "text-neutral-900",
                  ].join(" ")}
                >
                  {step.label}
                </span>
                {step.required && (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    Required
                  </span>
                )}
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    STATUS_BADGE_CLASS[step.status],
                  ].join(" ")}
                >
                  {STATUS_LABEL[step.status]}
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-500">{step.description}</p>
              {step.status !== "approved" && (
                <Link
                  href={href}
                  className="mt-2 inline-block text-xs font-semibold text-[#1B4D3E] hover:underline"
                >
                  {step.status === "not_started" ? "Get started" : "Continue"} &rarr;
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
