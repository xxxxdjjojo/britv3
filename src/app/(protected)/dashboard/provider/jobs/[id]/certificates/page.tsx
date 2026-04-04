/**
 * /dashboard/provider/jobs/[id]/certificates
 *
 * Server component: lists all certificates issued for this booking
 * and renders the CertificateIssueForm to issue new ones.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, FileText, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { resolveProviderId } from "@/lib/provider/resolve-provider";
import {
  getCertificatesByBooking,
} from "@/services/provider/provider-certificate-service";
import type { Certificate } from "@/services/provider/provider-certificate-service";
import { CertificateIssueForm } from "@/components/dashboard/provider/CertificateIssueForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Job Certificates — Provider Dashboard" };

type Params = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CERTIFICATE_TYPE_LABELS: Record<string, string> = {
  gas_safe_cp12: "Gas Safe CP12",
  eic: "EIC",
  eicr: "EICR",
  minor_works: "Minor Works",
  custom: "Custom",
};

const CERTIFICATE_TYPE_COLORS: Record<string, string> = {
  gas_safe_cp12: "bg-warning-light text-warning",
  eic: "bg-info-light text-info",
  eicr: "bg-info-light text-info",
  minor_works: "bg-brand-primary-lighter text-brand-primary",
  custom: "bg-neutral-100 text-neutral-700",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function isExpiringSoon(expiresAt: string | null) {
  if (!expiresAt) return false;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return diff > 0 && diff < 1000 * 60 * 60 * 24 * 90; // within 90 days
}

// ---------------------------------------------------------------------------
// Certificate list item
// ---------------------------------------------------------------------------

function CertificateCard({ cert }: { cert: Certificate }) {
  const typeLabel = CERTIFICATE_TYPE_LABELS[cert.certificateType] ?? cert.certificateType;
  const typeColor = CERTIFICATE_TYPE_COLORS[cert.certificateType] ?? "bg-neutral-100 text-neutral-700";
  const expiring = isExpiringSoon(cert.expiresAt);

  return (
    <div className="flex items-start gap-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary-lighter">
        <ShieldCheck className="size-5 text-brand-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeColor}`}>
            {typeLabel}
          </span>
          {cert.certificateNumber && (
            <span className="font-mono text-sm text-neutral-700">#{cert.certificateNumber}</span>
          )}
          {expiring && (
            <span className="rounded-full bg-warning-light px-2 py-0.5 text-xs font-medium text-warning">
              Expiring soon
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-neutral-500">
          <span>Issued: {formatDate(cert.issuedAt) ?? "—"}</span>
          {cert.expiresAt && (
            <span className={expiring ? "text-warning font-medium" : ""}>
              Expires: {formatDate(cert.expiresAt)}
            </span>
          )}
        </div>
        {cert.notes && (
          <p className="mt-1 text-xs text-neutral-600 line-clamp-2">{cert.notes}</p>
        )}
        {cert.filePath && (
          <p className="mt-1 flex items-center gap-1 text-xs text-brand-primary">
            <FileText className="size-3" />
            File attached
          </p>
        )}
      </div>
      <div className="shrink-0 text-xs text-neutral-400">
        {formatDate(cert.createdAt)}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CertificatesPage({ params }: Params) {
  try {
    const { id: bookingId } = await params;

    const supabase = await createClient();

  // Auth + provider resolution
  let providerId: string;
  try {
    const identity = await resolveProviderId(supabase);
    providerId = identity.providerId;
  } catch {
    notFound();
  }

  // Verify booking belongs to provider
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, provider_id, status")
    .eq("id", bookingId)
    .eq("provider_id", providerId!)
    .maybeSingle();

  if (!booking) {
    notFound();
  }

  // Fetch existing certificates
  let certificates: Certificate[] = [];
  try {
    certificates = await getCertificatesByBooking(supabase, bookingId, providerId!);
  } catch {
    // Non-fatal — show empty state
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      {/* Back nav */}
      <Link
        href={`/dashboard/provider/jobs/${bookingId}`}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
      >
        <ChevronLeft className="size-4" />
        Back to Job
      </Link>

      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-neutral-900">Job Certificates</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Issue and manage compliance certificates for this job.
        </p>
      </div>

      {/* Existing certificates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Issued Certificates
            {certificates.length > 0 && (
              <span className="ml-2 rounded-full bg-brand-primary-lighter px-2 py-0.5 text-xs font-medium text-brand-primary">
                {certificates.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No certificates have been issued for this job yet.
            </p>
          ) : (
            <div className="space-y-3">
              {certificates.map((cert) => (
                <CertificateCard key={cert.id} cert={cert} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issue new certificate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Issue New Certificate</CardTitle>
        </CardHeader>
        <CardContent>
          <CertificateIssueForm
            bookingId={bookingId}
            providerId={providerId!}
          />
        </CardContent>
      </Card>
    </div>
    );
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error;
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-xl font-bold text-neutral-900">Certificates</h1>
        <p className="mt-4 text-sm text-neutral-500">Unable to load certificate data. Please try refreshing the page.</p>
      </div>
    );
  }
}
