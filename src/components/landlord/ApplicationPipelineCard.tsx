"use client";

import Link from "next/link";
import { Mail, Briefcase, ArrowRight } from "lucide-react";

import type { TenantApplication, TenantApplicationStatus, CreditCheckStatus, ReferencesStatus } from "@/types/landlord";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// -- Status badge config ------------------------------------------------------

const STATUS_STYLES: Record<
  TenantApplicationStatus,
  { bg: string; text: string; dot: string; label: string }
> = {
  received: {
    bg: "bg-muted dark:bg-gray-800/40",
    text: "text-gray-700 dark:text-gray-300",
    dot: "bg-muted-foreground",
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
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    dot: "bg-green-500",
    label: "Approved",
  },
  rejected: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    dot: "bg-red-500",
    label: "Rejected",
  },
  withdrawn: {
    bg: "bg-muted dark:bg-gray-800/40",
    text: "text-gray-600 dark:text-gray-400",
    dot: "bg-gray-400",
    label: "Withdrawn",
  },
};

const CREDIT_STYLES: Record<
  CreditCheckStatus,
  { variant: "outline" | "secondary" | "destructive"; label: string }
> = {
  pending: { variant: "outline", label: "Credit: Pending" },
  passed: { variant: "secondary", label: "Credit: Passed" },
  failed: { variant: "destructive", label: "Credit: Failed" },
  not_run: { variant: "outline", label: "Credit: Not run" },
};

const REF_STYLES: Record<
  ReferencesStatus,
  { variant: "outline" | "secondary"; label: string }
> = {
  pending: { variant: "outline", label: "Refs: Pending" },
  received: { variant: "outline", label: "Refs: Received" },
  verified: { variant: "secondary", label: "Refs: Verified" },
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
    <Card className="mb-3 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header: avatar + name */}
        <div className="flex items-start gap-3">
          <div className="size-9 shrink-0 rounded-full bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{application.applicant_name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
              <Mail className="size-3 shrink-0" />
              <span className="truncate">{application.applicant_email}</span>
            </div>
          </div>
        </div>

        {/* Income + employment */}
        {(application.monthly_income != null || application.employment_status) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Briefcase className="size-3 shrink-0" />
            <span>
              {application.employment_status ?? "—"}
              {application.monthly_income != null && (
                <span className="ml-1 font-medium text-foreground">
                  · £{application.monthly_income.toLocaleString("en-GB")}/mo
                </span>
              )}
            </span>
          </div>
        )}

        {/* Status badges */}
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}
          >
            <span className={`size-1.5 rounded-full ${statusStyle.dot}`} />
            {statusStyle.label}
          </span>
          <Badge variant={creditStyle.variant} className="text-xs">
            {creditStyle.label}
          </Badge>
          <Badge variant={refStyle.variant} className="text-xs">
            {refStyle.label}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href={`/dashboard/landlord/tenants/${application.id}`}>
              Review
              <ArrowRight className="ml-1 size-3" />
            </Link>
          </Button>
          {onMoveToNextStage && (
            <button
              onClick={onMoveToNextStage}
              className="text-xs text-brand-primary dark:text-emerald-400 font-medium hover:underline"
            >
              Move stage
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
