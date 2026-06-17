import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Home, User, DollarSign, Upload } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getTenancy } from "@/services/landlord/tenancy-service";
import { Button } from "@/components/ui/button";
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
      .select("full_name:display_name")
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
    <div className="space-y-6">
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

      {/* Page header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400 mb-1">
            Documents
          </p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-brand-primary-dark">
            Tenancy Agreement
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {tenancy.tenant_name} · {propertyAddress}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <Button variant="outline" size="sm">
            Save Draft
          </Button>
          <Button
            size="sm"
            className="bg-brand-gold text-brand-gold-foreground hover:bg-brand-gold/90 font-semibold"
          >
            Send for Signature
          </Button>
        </div>
      </div>

      {/* Two-column builder layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* LEFT — Form sections */}
        <div className="space-y-5">

          {/* Section: Upload Existing Agreement */}
          <div className="rounded-xl border border-border bg-white dark:bg-card">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <div className="size-8 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                <Upload className="size-4 text-brand-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Upload Existing Agreement</h2>
                <p className="text-xs text-muted-foreground">
                  Already have a signed tenancy agreement? Upload it here to keep on file.
                </p>
              </div>
            </div>
            <div className="px-5 py-4">
              <TenancyAgreementUpload
                tenancyId={tenancy.id}
                propertyId={tenancy.property_id}
                tenantName={tenancy.tenant_name}
              />
            </div>
          </div>

          {/* Section: Property Details */}
          <div className="rounded-xl border border-border bg-white dark:bg-card">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <div className="size-8 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                <Home className="size-4 text-brand-primary" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">Property Details</h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Property Address</p>
                <p className="text-sm font-medium text-foreground">{propertyAddress}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Address is pre-filled from your active listing.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Tenant Information */}
          <div className="rounded-xl border border-border bg-white dark:bg-card">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <div className="size-8 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                <User className="size-4 text-brand-primary" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">Tenant Information</h2>
            </div>
            <div className="px-5 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Lead Tenant Name</p>
                  <p className="text-sm font-medium text-foreground">{tenancy.tenant_name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Financial Terms */}
          <div className="rounded-xl border border-border bg-white dark:bg-card">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <div className="size-8 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                <DollarSign className="size-4 text-brand-primary" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">Financial Terms</h2>
            </div>
            <div className="px-5 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Lease Start</p>
                  <p className="font-medium text-foreground">{tenancy.lease_start_date}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Lease End</p>
                  <p className="font-medium text-foreground">
                    {tenancy.lease_end_date ?? "Periodic"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Rent</p>
                  <p className="font-medium text-foreground">
                    £{tenancy.rent_amount.toLocaleString("en-GB")} / {tenancy.rent_frequency}
                  </p>
                </div>
                {tenancy.deposit_amount != null && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Deposit</p>
                    <p className="font-medium text-foreground">
                      £{tenancy.deposit_amount.toLocaleString("en-GB")}
                      {tenancy.deposit_scheme ? ` (${tenancy.deposit_scheme})` : ""}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT — Live Preview panel */}
        <div className="lg:sticky lg:top-6 space-y-4">
          {/* Preview card */}
          <div className="rounded-xl border border-border bg-white dark:bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-neutral-400">
                Live Preview
              </span>
            </div>
            <div className="px-4 py-5 space-y-4">
              {/* Mini document preview */}
              <div className="rounded-lg border border-border bg-surface p-4 min-h-[260px] flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Assured Shorthold
                    </p>
                    <p className="text-sm font-bold text-brand-primary-dark leading-tight">
                      Tenancy Agreement
                    </p>
                  </div>
                </div>
                <div className="space-y-3 text-xs text-muted-foreground flex-1">
                  <div>
                    <p className="font-semibold text-foreground text-[10px] uppercase tracking-wider mb-1">
                      1. The Parties
                    </p>
                    <p className="leading-relaxed">
                      Landlord: {landlordName}
                    </p>
                    <p className="leading-relaxed">Tenant: {tenancy.tenant_name}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-[10px] uppercase tracking-wider mb-1">
                      2. The Property
                    </p>
                    <p className="leading-relaxed">{propertyAddress}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-[10px] uppercase tracking-wider mb-1">
                      3. The Main Terms
                    </p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                      <span className="text-muted-foreground">Rent:</span>
                      <span className="text-foreground font-medium">
                        £{tenancy.rent_amount.toLocaleString("en-GB")} / {tenancy.rent_frequency}
                      </span>
                      <span className="text-muted-foreground">From:</span>
                      <span className="text-foreground font-medium">{tenancy.lease_start_date}</span>
                      <span className="text-muted-foreground">To:</span>
                      <span className="text-foreground font-medium">
                        {tenancy.lease_end_date ?? "Periodic"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal disclaimer */}
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/20 p-3 text-xs text-amber-700 dark:text-amber-300">
                This document is for guidance only. Seek independent legal advice before using as a
                legally binding tenancy agreement.
              </div>

              {/* Generate New Agreement section */}
              <div className="rounded-xl border border-border bg-white dark:bg-card">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                  <FileText className="size-4 text-brand-primary shrink-0" />
                  <h2 className="text-sm font-semibold text-foreground">Generate New Agreement</h2>
                </div>
                <div className="px-4 py-4">
                  <p className="text-xs text-muted-foreground mb-4">
                    Generate a standard Assured Shorthold Tenancy Agreement as a PDF, pre-filled with the
                    tenancy details below. Download and sign manually.
                  </p>
                  {/* PDF download — client-side only (dynamic ssr:false in wrapper) */}
                  <TenancyAgreementPDFWrapper
                    tenancy={tenancy}
                    landlordName={landlordName}
                    propertyAddress={propertyAddress}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
