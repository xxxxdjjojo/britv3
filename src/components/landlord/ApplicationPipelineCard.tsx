"use client";

import Link from "next/link";
import { Mail, Briefcase, ArrowRight, PoundSterling } from "lucide-react";

import type { TenantApplication, TenantApplicationStatus, CreditCheckStatus, ReferencesStatus } from "@/types/landlord";
import { Button } from "@/components/ui/button";

// -- Status badge config ------------------------------------------------------

const STATUS_STYLES: Record<
  TenantApplicationStatus,
  { bg: string; text: string; dot: string; label: string }
> = {
  received: {
    bg: "bg-slate-100 dark:bg-slate-800/40",
    text: "text-slate-700 dark:text-slate-300",
    dot: "bg-slate-400",
    label: "Received",
  },
  shortlisted: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
    label: "Shortlisted",
  },
  referencing: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
    label: "Referencing",
  },
  approved: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
    label: "Approved",
  },
  rejected: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    dot: "bg-red-500",
    label: "Rejected",
  },
  withdrawn: {
    bg: "bg-slate-100 dark:bg-slate-800/40",
    text: "text-slate-600 dark:text-slate-400",
    dot: "bg-slate-400",
    label: "Withdrawn",
  },
};

const CREDIT_STYLES: Record<
  CreditCheckStatus,
  { bg: string; text: string; label: string }
> = {
  pending: {
    bg: "bg-slate-100 dark:bg-slate-800/40",
    text: "text-slate-600 dark:text-slate-400",
    label: "Credit: Pending",
  },
  passed: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
    label: "Credit: Passed",
  },
  failed: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    label: "Credit: Failed",
  },
  not_run: {
    bg: "bg-slate-100 dark:bg-slate-800/40",
    text: "text-slate-500 dark:text-slate-500",
    label: "Credit: Not run",
  },
};

const REF_STYLES: Record<
  ReferencesStatus,
  { bg: string; text: string; label: string }
> = {
  pending: {
    bg: "bg-slate-100 dark:bg-slate-800/40",
    text: "text-slate-600 dark:text-slate-400",
    label: "Refs: Pending",
  },
  received: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    label: "Refs: Received",
  },
  verified: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
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
    <div className="mb-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 shadow-sm hover:shadow-md hover:border-[color:var(--color-brand-primary)]/30 transition-all duration-150">
      {/* Header: avatar + name */}
      <div className="flex items-start gap-2.5">
        <div className="size-8 shrink-0 rounded-full bg-[color:var(--color-brand-primary-lighter)] dark:bg-[color:var(--color-brand-primary)]/20 text-[color:var(--color-brand-primary)] dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
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
          className="h-7 text-xs border-[color:var(--color-brand-primary)]/30 text-[color:var(--color-brand-primary)] hover:bg-[color:var(--color-brand-primary-lighter)] hover:text-[color:var(--color-brand-primary)] dark:border-emerald-800/50 dark:text-emerald-400"
        >
          <Link href={`/dashboard/landlord/tenants/${application.id}`}>
            Review
            <ArrowRight className="ml-1 size-3" />
          </Link>
        </Button>
        {onMoveToNextStage && (
          <button
            onClick={onMoveToNextStage}
            className="text-xs text-[color:var(--color-brand-primary)] dark:text-emerald-400 font-medium hover:underline"
          >
            Move stage
          </button>
        )}
      </div>
    </div>
  );
}
