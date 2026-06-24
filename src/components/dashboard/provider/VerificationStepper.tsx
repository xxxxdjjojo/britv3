import type React from "react";
import Link from "next/link";
import {
  Check,
  ShieldCheck,
  FileText,
  GraduationCap,
  Users,
  Star,
} from "lucide-react";
import type { VerificationStep } from "@/services/provider/provider-verification-service";

const STEP_LINKS: Record<string, string> = {
  id_check: "/dashboard/provider/verification/credentials",
  insurance: "/dashboard/provider/verification/credentials",
  qualifications: "/dashboard/provider/verification/credentials",
  client_references: "/dashboard/provider/verification/client-references",
  peer_references: "/dashboard/provider/verification/peer-references",
};

const STEP_ICONS: Record<string, React.ElementType> = {
  id_check: ShieldCheck,
  insurance: FileText,
  qualifications: GraduationCap,
  client_references: Users,
  peer_references: Star,
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
  in_progress: "bg-warning/10 text-warning",
  submitted: "bg-info/10 text-info",
  approved: "bg-success/10 text-success",
  rejected: "bg-error/10 text-error",
};

const ACTION_LABEL: Record<VerificationStep["status"], string | null> = {
  not_started: "Get started",
  in_progress: "Continue",
  submitted: null,
  approved: null,
  rejected: "Re-apply",
};

type VerificationStepperProps = Readonly<{
  steps: VerificationStep[];
}>;

export function VerificationStepper({ steps }: VerificationStepperProps) {
  return (
    <div>
      <h2 className="mb-6 text-base font-semibold text-neutral-900">Verification Steps</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {steps.map((step) => {
        const isApproved = step.status === "approved";
        const href = STEP_LINKS[step.stepId] ?? "/dashboard/provider/verification";
        const actionLabel = ACTION_LABEL[step.status];
        const Icon = STEP_ICONS[step.stepId] ?? ShieldCheck;

        return (
          <div
            key={step.stepId}
            className={[
              "relative flex flex-col gap-3 rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md",
              isApproved
                ? "border-success/20 bg-success/5"
                : "border-border bg-white",
            ].join(" ")}
          >
            {/* Status badge */}
            <div className="flex items-center justify-between gap-2">
              <div
                className={[
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  isApproved
                    ? "bg-success/10 text-success"
                    : "bg-brand-primary-lighter text-brand-primary",
                ].join(" ")}
              >
                {isApproved ? (
                  <Check className="size-4" strokeWidth={2.5} />
                ) : (
                  <Icon className="size-4" />
                )}
              </div>
              <span
                className={[
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]",
                  STATUS_BADGE_CLASS[step.status],
                ].join(" ")}
              >
                {STATUS_LABEL[step.status]}
              </span>
            </div>

            {/* Title + required badge */}
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-neutral-900 leading-snug">
                {step.label}
              </p>
              {step.required && (
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  Required
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-neutral-500 leading-relaxed">
              {step.description}
            </p>

            {/* Rejection reason */}
            {step.status === "rejected" && step.rejectionReason && (
              <div className="rounded-lg border border-error/20 bg-error/5 p-2 text-xs text-error">
                <span className="font-semibold">Reason:</span>{" "}
                {step.rejectionReason}
              </div>
            )}

            {/* Action links */}
            {actionLabel && (
              <div className="mt-auto flex items-center gap-3 pt-1">
                <Link
                  href={href}
                  className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.08em] text-brand-primary transition-colors hover:text-brand-primary-dark"
                >
                  {actionLabel} &rarr;
                </Link>
                {step.status === "rejected" && (
                  <Link
                    href="/help?topic=verification"
                    className="text-xs text-neutral-400 underline underline-offset-2 hover:text-neutral-600"
                  >
                    Contact Support
                  </Link>
                )}
              </div>
            )}

            {step.status === "submitted" && (
              <p className="mt-auto pt-1 text-xs font-medium text-info">
                Under review — no action needed.
              </p>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
