import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Briefcase,
  PoundSterling,
  ClipboardCheck,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Circle,
  TrendingUp,
  FileText,
  MessageSquare,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getApplicationById } from "@/services/landlord/tenant-application-service";
import type { TenantApplicationStatus, CreditCheckStatus } from "@/types/landlord";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationDetailActions } from "@/components/landlord/ApplicationDetailActions";
import { Skeleton } from "@/components/ui/skeleton";

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
  passed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  not_run: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const PIPELINE_STEPS: TenantApplicationStatus[] = [
  "received",
  "shortlisted",
  "referencing",
  "approved",
];

// -- Page ---------------------------------------------------------------------

type Props = {
  params: Promise<{ applicationId: string }>;
};


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-48 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent({ params }: Props) {
  const { applicationId } = await params;
  const supabase = await createClient();

  let application;
  try {
    application = await getApplicationById(supabase, applicationId);
  } catch {
    notFound();
  }

  const creditStyle = CREDIT_STYLES[application.credit_check_status ?? "not_run"];
  const currentStepIndex = PIPELINE_STEPS.indexOf(application.status as TenantApplicationStatus);

  const initials = application.applicant_name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb / back */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/dashboard/landlord/tenants"
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="size-3.5" />
          Tenant Screening
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{application.applicant_name}</span>
      </div>

      {/* Applicant hero card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="size-16 shrink-0 rounded-2xl bg-[color:var(--color-brand-primary-lighter)] dark:bg-[color:var(--color-brand-primary)]/20 text-[color:var(--color-brand-primary)] dark:text-emerald-400 flex items-center justify-center font-bold text-xl font-heading">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading tracking-tight">
                {application.applicant_name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  <a
                    href={`mailto:${application.applicant_email}`}
                    className="hover:text-foreground hover:underline transition-colors"
                  >
                    {application.applicant_email}
                  </a>
                </span>
                {application.employment_status && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="size-3.5" />
                    {application.employment_status}
                  </span>
                )}
                {application.monthly_income != null && (
                  <span className="flex items-center gap-1.5">
                    <PoundSterling className="size-3.5" />
                    £{application.monthly_income.toLocaleString("en-GB")}/month
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status badge + CTA */}
          <div className="flex items-center gap-3 sm:flex-col sm:items-end">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                application.status === "approved"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : application.status === "rejected"
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              }`}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {STATUS_LABELS[application.status]}
            </span>
            <Button
              asChild
              className="bg-[color:var(--color-brand-primary)] hover:bg-[color:var(--color-brand-primary-light)] text-white font-medium"
            >
              <Link href={`/dashboard/landlord/tenants/${applicationId}/decision`}>
                Make Decision
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: screening + income */}
        <div className="lg:col-span-2 space-y-5">
          {/* Screening results */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <TrendingUp className="size-4 text-[color:var(--color-brand-primary)]" />
                Screening Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {/* Credit check */}
                <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Credit Check
                  </p>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${creditStyle}`}
                    >
                      {CREDIT_LABELS[application.credit_check_status ?? "not_run"]}
                    </span>
                  </div>
                </div>

                {/* References */}
                <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    References
                  </p>
                  <div className="mt-2">
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      {application.references_status
                        ? application.references_status.charAt(0).toUpperCase() +
                          application.references_status.slice(1)
                        : "Pending"}
                    </span>
                  </div>
                </div>

                {/* Income affordability */}
                {application.monthly_income != null && (
                  <div className="col-span-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Monthly Income
                    </p>
                    <p className="mt-1 text-xl font-bold font-heading text-foreground">
                      £{application.monthly_income.toLocaleString("en-GB")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Rent-to-income ratio eligible for most properties
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rejection reason */}
          {application.rejection_reason && (
            <Card className="rounded-2xl border-red-200 dark:border-red-800/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-heading text-red-700 dark:text-red-400">
                  Rejection Reason
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-700 dark:text-red-400">
                  {application.rejection_reason}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <MessageSquare className="size-4 text-muted-foreground" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {application.notes ?? "No notes recorded for this application."}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right column: pipeline + actions */}
        <div className="space-y-5">
          {/* Pipeline stepper */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <ClipboardCheck className="size-4 text-[color:var(--color-brand-primary)]" />
                Application Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-1">
                {PIPELINE_STEPS.map((step, index) => {
                  const isActive = application.status === step;
                  const isPast = currentStepIndex > index;
                  const isFuture = !isActive && !isPast;

                  return (
                    <li key={step} className="flex items-center gap-3 py-1.5">
                      {isPast ? (
                        <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
                      ) : isActive ? (
                        <CircleDot className="size-5 shrink-0 text-[color:var(--color-brand-primary)]" />
                      ) : (
                        <Circle className="size-5 shrink-0 text-slate-300 dark:text-slate-600" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          isActive
                            ? "text-[color:var(--color-brand-primary)] dark:text-emerald-400"
                            : isPast
                              ? "text-slate-600 dark:text-slate-300"
                              : isFuture
                                ? "text-muted-foreground"
                                : ""
                        }`}
                      >
                        {STATUS_LABELS[step]}
                      </span>
                      {isActive && (
                        <span className="ml-auto text-xs bg-[color:var(--color-brand-primary-lighter)] dark:bg-[color:var(--color-brand-primary)]/20 text-[color:var(--color-brand-primary)] dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                          Current
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>

          {/* Stage advance actions */}
          <ApplicationDetailActions application={application} />

          {/* Quick links */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full justify-start text-sm"
              >
                <Link href={`/dashboard/landlord/tenants/${applicationId}/decision`}>
                  <ClipboardCheck className="mr-2 size-4" />
                  Make a Decision
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full justify-start text-sm"
              >
                <Link href={`/dashboard/landlord/tenants/${applicationId}/tenancy/agreement`}>
                  <FileText className="mr-2 size-4" />
                  Tenancy Agreement
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent params={params} />
    </Suspense>
  );
}
