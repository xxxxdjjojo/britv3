import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Briefcase,
  PoundSterling,
  ClipboardCheck,
  ArrowRight,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getApplicationById, updateApplicationStatus } from "@/services/landlord/tenant-application-service";
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
  not_run: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb / back */}
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/landlord/tenants">
            <ArrowLeft className="mr-1 size-4" />
            Tenant Screening
          </Link>
        </Button>
      </div>

      {/* Page title */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{application.applicant_name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Application · {STATUS_LABELS[application.status]}
          </p>
        </div>
        <Button asChild style={{ backgroundColor: "#1B4D3E" }} className="text-white hover:opacity-90">
          <Link href={`/dashboard/landlord/tenants/${applicationId}/decision`}>
            Make Decision
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Applicant details */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Applicant Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-4 shrink-0" />
                <a
                  href={`mailto:${application.applicant_email}`}
                  className="text-foreground hover:underline"
                >
                  {application.applicant_email}
                </a>
              </div>

              {application.employment_status && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="size-4 shrink-0" />
                  <span className="text-foreground">{application.employment_status}</span>
                </div>
              )}

              {application.monthly_income != null && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <PoundSterling className="size-4 shrink-0" />
                  <span className="text-foreground">
                    £{application.monthly_income.toLocaleString("en-GB")} / month
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Screening Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Credit Check</span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${creditStyle}`}
                >
                  {CREDIT_LABELS[application.credit_check_status ?? "not_run"]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">References</span>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {application.references_status
                    ? application.references_status.charAt(0).toUpperCase() +
                      application.references_status.slice(1)
                    : "Pending"}
                </span>
              </div>
            </CardContent>
          </Card>

          {application.rejection_reason && (
            <Card className="border-red-200 dark:border-red-800/30">
              <CardHeader>
                <CardTitle className="text-base text-red-700 dark:text-red-400">
                  Rejection Reason
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{application.rejection_reason}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Timeline + actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardCheck className="size-4" />
                Pipeline Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative border-l border-slate-200 dark:border-slate-700 ml-3">
                {(
                  [
                    "received",
                    "shortlisted",
                    "referencing",
                    "approved",
                  ] as TenantApplicationStatus[]
                ).map((step) => {
                  const isActive = application.status === step;
                  const isPast =
                    ["received", "shortlisted", "referencing", "approved"].indexOf(
                      application.status,
                    ) >
                    ["received", "shortlisted", "referencing", "approved"].indexOf(step);

                  return (
                    <li key={step} className="mb-4 ml-4">
                      <span
                        className={`absolute -left-1.5 size-3 rounded-full border-2 border-white dark:border-background ${
                          isActive
                            ? "bg-[#1B4D3E]"
                            : isPast
                              ? "bg-green-400"
                              : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      />
                      <p
                        className={`text-sm font-medium ${
                          isActive
                            ? "text-[#1B4D3E] dark:text-emerald-400"
                            : isPast
                              ? "text-slate-600 dark:text-slate-300"
                              : "text-muted-foreground"
                        }`}
                      >
                        {STATUS_LABELS[step]}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>

          {/* Interactive actions */}
          <ApplicationDetailActions application={application} />

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {application.notes ?? "No notes yet."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
