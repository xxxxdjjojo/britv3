"use client";

import Link from "next/link";
import { Mail, Briefcase, ArrowRight, PoundSterling } from "lucide-react";

import type { TenantApplication, CreditCheckStatus, ReferencesStatus } from "@/types/landlord";
import { Button } from "@/components/ui/button";
import { STATUS_STYLES } from "@/lib/tenant-status-styles";

const CREDIT_STYLES: Record<
  CreditCheckStatus,
  { bg: string; text: string; label: string }
> = {
  pending: {
    bg: "bg-neutral-100 dark:bg-neutral-800/40",
    text: "text-neutral-600 dark:text-neutral-400",
    label: "Credit: Pending",
  },
  passed: {
    bg: "bg-success/10 dark:bg-success/20",
    text: "text-success dark:text-success",
    label: "Credit: Passed",
  },
  failed: {
    bg: "bg-error/10 dark:bg-error/20",
    text: "text-error dark:text-error",
    label: "Credit: Failed",
  },
  not_run: {
    bg: "bg-neutral-100 dark:bg-neutral-800/40",
    text: "text-neutral-500 dark:text-neutral-500",
    label: "Credit: Not run",
  },
};

const REF_STYLES: Record<
  ReferencesStatus,
  { bg: string; text: string; label: string }
> = {
  pending: {
    bg: "bg-neutral-100 dark:bg-neutral-800/40",
    text: "text-neutral-600 dark:text-neutral-400",
    label: "Refs: Pending",
  },
  received: {
    bg: "bg-brand-accent/10 dark:bg-brand-accent/20",
    text: "text-brand-accent dark:text-brand-accent",
    label: "Refs: Received",
  },
  verified: {
    bg: "bg-success/10 dark:bg-success/20",
    text: "text-success dark:text-success",
    label: "Refs: Verified",
  },
};

// -- Props --------------------------------------------------------------------

type ApplicationPipelineCardProps = Readonly<{
  application: TenantApplication;
  onMoveToNextStage?: () => void;
}>;

// -- Component ----------------------------------------------------------------

export function ApplicationPipelineCard({
  application,
  onMoveToNextStage,
}: ApplicationPipelineCardProps) {
  const statusStyle = STATUS_STYLES[application.status];
  const creditStyle = CREDIT_STYLES[application.credit_check_status ?? "not_run"];
  const refStyle = REF_STYLES[application.references_status ?? "pending"];

  const initials = application.applicant_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mb-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3.5 shadow-sm hover:shadow-md hover:border-brand-primary/30 transition-all duration-150">
      {/* Header: avatar + name */}
      <div className="flex items-start gap-2.5">
        <div className="size-8 shrink-0 rounded-full bg-[color:var(--color-brand-primary-lighter)] dark:bg-[color:var(--color-brand-primary)]/20 text-[color:var(--color-brand-primary)] dark:text-brand-primary flex items-center justify-center font-bold text-xs">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm font-heading truncate">{application.applicant_name}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground truncate mt-0.5">
            <Mail className="size-3 shrink-0" />
            <span className="truncate">{application.applicant_email}</span>
          </div>
        </div>
      </div>

      {/* Income + employment */}
      {(application.monthly_income != null || application.employment_status) && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Briefcase className="size-3 shrink-0" />
          <span className="truncate">
            {application.employment_status ?? "—"}
            {application.monthly_income != null && (
              <>
                <span className="mx-1">·</span>
                <PoundSterling className="size-3 inline-block" />
                <span className="font-medium text-foreground">
                  {application.monthly_income.toLocaleString("en-GB")}/mo
                </span>
              </>
            )}
          </span>
        </div>
      )}

      {/* Status chips */}
      <div className="mt-2.5 flex flex-wrap gap-1">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
        >
          <span className={`size-1.5 rounded-full ${statusStyle.dot}`} />
          {statusStyle.label}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${creditStyle.bg} ${creditStyle.text}`}
        >
          {creditStyle.label}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${refStyle.bg} ${refStyle.text}`}
        >
          {refStyle.label}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-7 text-xs border-[color:var(--color-brand-primary)]/30 text-[color:var(--color-brand-primary)] hover:bg-[color:var(--color-brand-primary-lighter)] hover:text-[color:var(--color-brand-primary)] dark:border-brand-primary/30 dark:text-brand-primary"
        >
          <Link href={`/dashboard/landlord/tenants/${application.id}`}>
            Review
            <ArrowRight className="ml-1 size-3" />
          </Link>
        </Button>
        {onMoveToNextStage && (
          <button
            onClick={onMoveToNextStage}
            className="text-xs text-[color:var(--color-brand-primary)] dark:text-brand-primary font-medium hover:underline"
          >
            Move stage
          </button>
        )}
      </div>
    </div>
  );
}
