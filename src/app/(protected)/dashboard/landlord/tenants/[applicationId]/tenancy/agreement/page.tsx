import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Upload, Sparkles, Home, ShieldCheck, Info } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getTenancy } from "@/services/landlord/tenancy-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TenancyAgreementUpload } from "@/components/landlord/TenancyAgreementUpload";
// Client wrapper with dynamic(ssr:false) — must be in a Client Component tree
import { TenancyAgreementPDFWrapper } from "@/components/landlord/TenancyAgreementPDFWrapper";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { applicationId: tenancyId } = await params;
  const supabase = await createClient();

  // Fetch tenancy
  let tenancy;
  try {
    tenancy = await getTenancy(supabase, tenancyId);
  } catch {
    notFound();
  }

  // Fetch landlord profile name
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let landlordName = "Landlord";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    if (profile?.full_name) landlordName = profile.full_name;
  }

  // Fetch property address
  let propertyAddress = "Property address not available";
  const { data: property } = await supabase
    .from("properties")
    .select("address_line_1, city, postcode")
    .eq("id", tenancy.property_id)
    .single();

  if (property) {
    propertyAddress = [property.address_line_1, property.city, property.postcode]
      .filter(Boolean)
      .join(", ");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/dashboard/landlord/tenants"
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="size-3.5" />
          Tenants
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{tenancy.tenant_name}</span>
        <span>/</span>
        <span className="text-foreground font-medium">Agreement</span>
      </nav>

      {/* Page header */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-2xl bg-[color:var(--color-brand-primary-lighter)] dark:bg-[color:var(--color-brand-primary)]/20 flex items-center justify-center shrink-0">
            <FileText className="size-6 text-[color:var(--color-brand-primary)]" />
          </div>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Tenancy Agreement Builder</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {tenancy.tenant_name}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Home className="size-3.5" />
              <span>{propertyAddress}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tenancy summary card */}
      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <ShieldCheck className="size-4 text-[color:var(--color-brand-primary)]" />
            Tenancy Details
          </CardTitle>
          <CardDescription>
            These details will be pre-filled in the generated agreement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Tenant</dt>
              <dd className="font-semibold text-foreground mt-0.5">{tenancy.tenant_name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Property</dt>
              <dd className="font-semibold text-foreground mt-0.5">{propertyAddress}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Lease Start</dt>
              <dd className="font-semibold text-foreground mt-0.5">{tenancy.lease_start_date}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Lease End</dt>
              <dd className="font-semibold text-foreground mt-0.5">
                {tenancy.lease_end_date ?? "Periodic"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Monthly Rent</dt>
              <dd className="font-semibold text-foreground mt-0.5">
                £{tenancy.rent_amount.toLocaleString("en-GB")} / {tenancy.rent_frequency}
              </dd>
            </div>
            {tenancy.deposit_amount != null && (
              <div>
                <dt className="text-muted-foreground">Deposit</dt>
                <dd className="font-semibold text-foreground mt-0.5">
                  £{tenancy.deposit_amount.toLocaleString("en-GB")}
                  {tenancy.deposit_scheme ? (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      ({tenancy.deposit_scheme})
                    </span>
                  ) : null}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Section 1: Upload existing agreement */}
      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-700">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
              <Upload className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-base font-heading">Upload Existing Agreement</CardTitle>
              <CardDescription className="mt-0.5">
                Already have a signed tenancy agreement? Upload it here to keep on file.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TenancyAgreementUpload
            tenancyId={tenancy.id}
            propertyId={tenancy.property_id}
            tenantName={tenancy.tenant_name}
          />
        </CardContent>
      </Card>

      {/* Section 2: Generate new agreement */}
      <Card className="rounded-2xl border-[color:var(--color-brand-primary)]/20 dark:border-emerald-800/30 bg-[color:var(--color-brand-primary-lighter)]/30 dark:bg-[color:var(--color-brand-primary)]/5">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-xl bg-[color:var(--color-brand-primary-lighter)] dark:bg-[color:var(--color-brand-primary)]/20 flex items-center justify-center shrink-0">
              <Sparkles className="size-4 text-[color:var(--color-brand-primary)]" />
            </div>
            <div>
              <CardTitle className="text-base font-heading flex items-center gap-2">
                Generate New Agreement
              </CardTitle>
              <CardDescription className="mt-0.5">
                Generate a standard Assured Shorthold Tenancy Agreement as a PDF, pre-filled with
                tenancy details. Download and sign manually.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Legal disclaimer */}
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/20 p-3.5">
            <div className="flex gap-3">
              <Info className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                <span className="font-semibold">Legal note:</span> This document is for guidance
                only. Seek independent legal advice before using as a legally binding tenancy
                agreement.
              </p>
            </div>
          </div>

          {/* PDF download button — client-side only (dynamic ssr:false in wrapper) */}
          <TenancyAgreementPDFWrapper
            tenancy={tenancy}
            landlordName={landlordName}
            propertyAddress={propertyAddress}
          />
        </CardContent>
      </Card>

      {/* Back link */}
      <div className="pb-4">
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/dashboard/landlord/tenants">
            <ArrowLeft className="mr-2 size-4" />
            Back to Tenants
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function TenancyAgreementPage({ params }: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent params={params} />
    </Suspense>
  );
}
