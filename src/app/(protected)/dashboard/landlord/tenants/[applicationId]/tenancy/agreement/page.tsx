import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getTenancy } from "@/services/landlord/tenancy-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TenancyAgreementUpload } from "@/components/landlord/TenancyAgreementUpload";
// Client wrapper with dynamic(ssr:false) — must be in a Client Component tree
import { TenancyAgreementPDFWrapper } from "@/components/landlord/TenancyAgreementPDFWrapper";

// -- Page ---------------------------------------------------------------------

type Props = {
  params: Promise<{ applicationId: string }>;
};

export default async function TenancyAgreementPage({ params }: Props) {
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/dashboard/landlord/tenants"
          className="hover:text-foreground transition-colors"
        >
          Tenants
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{tenancy.tenant_name}</span>
        <span>/</span>
        <span className="text-foreground font-medium">Agreement</span>
      </nav>

      {/* Back button */}
      <Button asChild variant="ghost" size="sm">
        <Link href="/dashboard/landlord/tenants">
          <ArrowLeft className="mr-1 size-4" />
          Back to Tenants
        </Link>
      </Button>

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tenancy Agreement</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {tenancy.tenant_name} · {propertyAddress}
        </p>
      </div>

      {/* Section 1: Upload existing agreement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Existing Agreement</CardTitle>
          <CardDescription>
            Already have a signed tenancy agreement? Upload it here to keep on file.
          </CardDescription>
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="size-4" />
            Generate New Agreement
          </CardTitle>
          <CardDescription>
            Generate a standard Assured Shorthold Tenancy Agreement as a PDF, pre-filled with the
            tenancy details below. Download and sign manually.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tenancy summary */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tenant</span>
              <span className="font-medium">{tenancy.tenant_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Property</span>
              <span className="font-medium text-right max-w-[60%]">{propertyAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lease Start</span>
              <span className="font-medium">{tenancy.lease_start_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lease End</span>
              <span className="font-medium">{tenancy.lease_end_date ?? "Periodic"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rent</span>
              <span className="font-medium">
                £{tenancy.rent_amount.toLocaleString("en-GB")} / {tenancy.rent_frequency}
              </span>
            </div>
            {tenancy.deposit_amount != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deposit</span>
                <span className="font-medium">
                  £{tenancy.deposit_amount.toLocaleString("en-GB")}
                  {tenancy.deposit_scheme ? ` (${tenancy.deposit_scheme})` : ""}
                </span>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/20 p-3 text-xs text-amber-700 dark:text-amber-300">
            This document is for guidance only. Seek independent legal advice before using as a
            legally binding tenancy agreement.
          </div>

          {/* PDF download — client-side only (dynamic ssr:false in wrapper) */}
          <TenancyAgreementPDFWrapper
            tenancy={tenancy}
            landlordName={landlordName}
            propertyAddress={propertyAddress}
          />
        </CardContent>
      </Card>
    </div>
  );
}
