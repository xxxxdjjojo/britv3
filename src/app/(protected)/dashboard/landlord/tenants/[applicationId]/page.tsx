import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Briefcase,
  PoundSterling,
  ClipboardCheck,
  ArrowRight,
  User,
  CheckCircle2,
  Circle,
  FileText,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getApplicationById } from "@/services/landlord/tenant-application-service";
import type { TenantApplicationStatus, CreditCheckStatus } from "@/types/landlord";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationDetailActions } from "@/components/landlord/ApplicationDetailActions";

// -- Status labels ------------------------------------------------------------

const STATUS_LABELS: Record<TenantApplicationStatus, string> = {
  received: "Received",
  shortlisted: "Shortlisted",
  referencing: "Referencing",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const CREDIT_LABELS: Record<CreditCheckStatus, string> = {
  pending: "Pending",
  passed: "Passed",
  failed: "Failed",
  not_run: "Not Run",
};

const CREDIT_STYLES: Record<CreditCheckStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  passed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  not_run: "bg-muted text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

const STATUS_BADGE_STYLES: Record<TenantApplicationStatus, string> = {
  received: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  shortlisted: "bg-brand-primary/10 text-brand-primary",
  referencing: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  withdrawn: "bg-muted text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

// -- Page ---------------------------------------------------------------------

type Props = {
  params: Promise<{ applicationId: string }>;
};

export default async function ApplicationDetailPage({ params }: Props) {
  const { applicationId } = await params;
  const supabase = await createClient();

  let application;
  try {
    application = await getApplicationById(supabase, applicationId);
  } catch {
    notFound();
  }

  const creditStyle = CREDIT_STYLES[application.credit_check_status ?? "not_run"];
  const statusBadgeStyle = STATUS_BADGE_STYLES[application.status];

  const pipelineSteps: TenantApplicationStatus[] = [
    "received",
    "shortlisted",
    "referencing",
    "approved",
  ];
  const currentStepIdx = pipelineSteps.indexOf(application.status);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumb / back */}
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="text-neutral-500 hover:text-neutral-800">
          <Link href="/dashboard/landlord/tenants">
            <ArrowLeft className="mr-1 size-4" />
            Tenant Screening
          </Link>
        </Button>
      </div>

      {/* Applicant hero card */}
      <Card className="border-border rounded-xl overflow-hidden">
        <CardContent className="p-0">
          {/* Top strip */}
          <div className="bg-brand-primary px-6 py-4 flex items-center justify-between gap-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">
              Tenant Application Review
            </p>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeStyle}`}
            >
              {STATUS_LABELS[application.status]}
            </span>
          </div>

          {/* Applicant identity row */}
          <div className="px-6 py-5 flex items-start gap-5">
            {/* Avatar placeholder */}
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary ring-2 ring-brand-primary/20">
              <User className="size-8" />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-brand-primary-dark leading-tight">
                {application.applicant_name}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-neutral-500">
                <a
                  href={`mailto:${application.applicant_email}`}
                  className="flex items-center gap-1.5 hover:text-brand-primary transition-colors"
                >
                  <Mail className="size-3.5 shrink-0" />
                  {application.applicant_email}
                </a>
                {application.employment_status && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="size-3.5 shrink-0" />
                    {application.employment_status}
                  </span>
                )}
                {application.monthly_income != null && (
                  <span className="flex items-center gap-1.5">
                    <PoundSterling className="size-3.5 shrink-0" />
                    £{application.monthly_income.toLocaleString("en-GB")} / month
                  </span>
                )}
              </div>
            </div>

            {/* Make Decision CTA */}
            <Button
              asChild
              className="bg-brand-primary text-white hover:bg-brand-primary-dark shrink-0 hidden sm:flex"
            >
              <Link href={`/dashboard/landlord/tenants/${applicationId}/decision`}>
                Make Decision
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Make Decision */}
      <div className="sm:hidden">
        <Button asChild className="w-full bg-brand-primary text-white hover:bg-brand-primary-dark">
          <Link href={`/dashboard/landlord/tenants/${applicationId}/decision`}>
            Make Decision
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>

      {/* Main 3-col grid: 2 content cols + 1 sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── Left + centre: detail cards (span 2) ── */}
        <div className="space-y-5 lg:col-span-2">

          {/* Applicant Details */}
          <Card className="rounded-xl border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-base font-semibold flex items-center gap-2 text-brand-primary-dark">
                <FileText className="size-4 text-brand-primary" />
                Applicant Details
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400 mb-1">
                    Email
                  </p>
                  <a
                    href={`mailto:${application.applicant_email}`}
                    className="text-foreground hover:underline hover:text-brand-primary transition-colors"
                  >
                    {application.applicant_email}
                  </a>
                </div>
                {application.employment_status && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400 mb-1">
                      Employment
                    </p>
                    <p className="text-foreground">{application.employment_status}</p>
                  </div>
                )}
              </div>

              {application.monthly_income != null && (
                <div className="pt-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400 mb-1">
                    Monthly Income
                  </p>
                  <p className="text-2xl font-bold text-brand-primary-dark">
                    £{application.monthly_income.toLocaleString("en-GB")}
                    <span className="text-base font-normal text-neutral-400 ml-1">/ month</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Screening Status */}
          <Card className="rounded-xl border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-base font-semibold flex items-center gap-2 text-brand-primary-dark">
                <ClipboardCheck className="size-4 text-brand-primary" />
                Screening Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {/* Credit Check */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
                <div>
                  <p className="font-medium text-foreground">Credit Check</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Automated credit assessment</p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${creditStyle}`}
                >
                  {CREDIT_LABELS[application.credit_check_status ?? "not_run"]}
                </span>
              </div>

              {/* References */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
                <div>
                  <p className="font-medium text-foreground">References</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Landlord &amp; employer references</p>
                </div>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-muted text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                  {application.references_status
                    ? application.references_status.charAt(0).toUpperCase() +
                      application.references_status.slice(1)
                    : "Pending"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="rounded-xl border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-base font-semibold text-brand-primary-dark">
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {application.notes ?? "No notes yet."}
              </p>
            </CardContent>
          </Card>

          {/* Rejection reason — conditional */}
          {application.rejection_reason && (
            <Card className="rounded-xl border-red-200 dark:border-red-800/30 bg-red-50/50 dark:bg-red-900/10">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-base font-semibold text-red-700 dark:text-red-400">
                  Rejection Reason
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-800 dark:text-red-300">{application.rejection_reason}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-5">

          {/* Pipeline Status */}
          <Card className="rounded-xl border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-base font-semibold flex items-center gap-2 text-brand-primary-dark">
                <ClipboardCheck className="size-4 text-brand-primary" />
                Pipeline Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {pipelineSteps.map((step, idx) => {
                  const isActive = application.status === step;
                  const isPast = currentStepIdx > idx;

                  return (
                    <li key={step} className="flex items-center gap-3">
                      <span className="shrink-0">
                        {isPast ? (
                          <CheckCircle2 className="size-5 text-green-500" />
                        ) : isActive ? (
                          <span className="flex size-5 items-center justify-center rounded-full bg-brand-primary">
                            <span className="size-2 rounded-full bg-white" />
                          </span>
                        ) : (
                          <Circle className="size-5 text-neutral-300 dark:text-neutral-600" />
                        )}
                      </span>
                      <p
                        className={`text-sm font-medium ${
                          isActive
                            ? "text-brand-primary dark:text-emerald-400"
                            : isPast
                              ? "text-neutral-600 dark:text-neutral-300"
                              : "text-muted-foreground"
                        }`}
                      >
                        {STATUS_LABELS[step]}
                      </p>
                      {isActive && (
                        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/10 rounded-full px-2 py-0.5">
                          Current
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>

          {/* Interactive actions */}
          <ApplicationDetailActions application={application} />

          {/* Make Decision (sidebar copy) */}
          <Card className="rounded-xl border-border">
            <CardContent className="pt-5">
              <Button
                asChild
                className="w-full bg-brand-primary text-white hover:bg-brand-primary-dark"
              >
                <Link href={`/dashboard/landlord/tenants/${applicationId}/decision`}>
                  Make Decision
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
