"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Download, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Tenancy } from "@/types/landlord";

// Dynamic import of the self-contained PDF download component (ssr: false
// because @react-pdf/renderer cannot run on the server).
const LeaseAgreementPDFDownload = dynamic(
  () =>
    import("@/components/landlord/LeaseAgreementPDF").then(
      (mod) => mod.LeaseAgreementPDFDownload,
    ),
  { ssr: false },
);

type LeasePreviewProps = Readonly<{
  tenancy: Tenancy;
  propertyAddress: string;
  landlordName: string;
  propertyId: string;
}>;

const LANDLORD_OBLIGATIONS = [
  "Keep the structure and exterior of the Property in good repair.",
  "Keep installations for the supply of water, gas, electricity, sanitation, and heating in good repair and proper working order.",
  "Ensure the Property meets the Homes (Fitness for Human Habitation) Act 2018 requirements.",
  "Protect the Deposit in a government-approved tenancy deposit scheme within 30 days of receipt.",
  "Provide the Tenant with the prescribed information about the deposit scheme.",
  "Provide the Tenant with a copy of the How to Rent guide.",
  "Ensure valid gas safety, electrical safety, and Energy Performance certificates are in place.",
];

const TENANT_OBLIGATIONS = [
  "Pay the Rent on time and in the agreed manner.",
  "Keep the interior of the Property in a clean and reasonable condition.",
  "Not cause or permit any damage to the Property beyond reasonable wear and tear.",
  "Not make any alterations to the Property without the Landlord's prior written consent.",
  "Allow the Landlord reasonable access (with at least 24 hours' written notice) for inspections and repairs.",
  "Not assign, sublet, or part with possession of the Property without the Landlord's prior written consent.",
  "Comply with all applicable laws and regulations.",
];

export default function LeasePreview({
  tenancy,
  propertyAddress,
  landlordName,
  propertyId,
}: LeasePreviewProps) {
  const [customClauses, setCustomClauses] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSaveToDocuments() {
    setIsSaving(true);
    try {
      const { leaseAgreementToBlob } = await import(
        "@/components/landlord/LeaseAgreementPDF"
      );
      const blob = await leaseAgreementToBlob({
        tenancy,
        propertyAddress,
        landlordName,
        customClauses,
      });

      const file = new File([blob], `lease-${tenancy.id}.pdf`, {
        type: "application/pdf",
      });

      const supabase = createClient();
      const documentId = crypto.randomUUID();
      const filePath = `${propertyId}/${documentId}/lease-${tenancy.id}.pdf`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("property-documents")
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("property-documents").getPublicUrl(filePath);

      // Create document record
      const response = await fetch(
        `/api/properties/${propertyId}/documents`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `Lease Agreement - ${tenancy.tenant_name}`,
            category: "lease_agreement",
            file_url: publicUrl,
            file_size: file.size,
            tenancy_id: tenancy.id,
          }),
        },
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save document record");
      }

      toast.success("Lease saved to property documents.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save lease";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* HTML Preview */}
      <div className="rounded-lg border border-border bg-white p-8 text-black dark:bg-neutral-50">
        <h2 className="text-center text-xl font-bold">
          Assured Shorthold Tenancy Agreement
        </h2>

        <div className="mx-auto mt-4 max-w-lg rounded border border-error/30 bg-error-light p-3 text-center text-sm text-error">
          This template is for guidance only. Seek legal advice before use.
        </div>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          {/* Section 1 */}
          <section>
            <h3 className="font-bold">1. PARTIES</h3>
            <p className="ml-4">
              <strong>Landlord:</strong> {landlordName}
            </p>
            <p className="ml-4">
              <strong>Tenant:</strong> {tenancy.tenant_name}
            </p>
            <p className="ml-4">
              <strong>Property:</strong> {propertyAddress}
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h3 className="font-bold">2. TERM</h3>
            <p className="ml-4">
              <strong>Start Date:</strong> {tenancy.lease_start_date}
            </p>
            <p className="ml-4">
              <strong>End Date:</strong>{" "}
              {tenancy.lease_end_date || "Periodic (rolling)"}
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h3 className="font-bold">3. RENT</h3>
            <p className="ml-4">
              <strong>Amount:</strong> GBP{" "}
              {tenancy.rent_amount.toLocaleString("en-GB", {
                minimumFractionDigits: 2,
              })}{" "}
              per{" "}
              {tenancy.rent_frequency === "monthly"
                ? "calendar month"
                : "week"}
            </p>
            <p className="ml-4">
              <strong>Payment Method:</strong> Bank transfer or standing order
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h3 className="font-bold">4. DEPOSIT</h3>
            {tenancy.deposit_amount ? (
              <>
                <p className="ml-4">
                  <strong>Amount:</strong> GBP{" "}
                  {tenancy.deposit_amount.toLocaleString("en-GB", {
                    minimumFractionDigits: 2,
                  })}
                </p>
                {tenancy.deposit_scheme && (
                  <p className="ml-4">
                    <strong>Scheme:</strong> {tenancy.deposit_scheme}
                  </p>
                )}
              </>
            ) : (
              <p className="ml-4">No deposit required.</p>
            )}
          </section>

          {/* Section 5 */}
          <section>
            <h3 className="font-bold">5. OBLIGATIONS</h3>
            <p className="ml-4 mt-2 font-semibold">
              Landlord&apos;s Obligations:
            </p>
            <ul className="ml-8 list-disc space-y-1">
              {LANDLORD_OBLIGATIONS.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
            <p className="ml-4 mt-4 font-semibold">
              Tenant&apos;s Obligations:
            </p>
            <ul className="ml-8 list-disc space-y-1">
              {TENANT_OBLIGATIONS.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h3 className="font-bold">6. NOTICES</h3>
            <p className="ml-4">
              The Landlord must give at least two months&apos; notice to end
              the tenancy (Section 21).
            </p>
            <p className="ml-4">
              The Tenant must give at least one month&apos; notice to end the
              tenancy.
            </p>
            <p className="ml-4">
              All notices must be in writing and served to the addresses stated
              in this agreement.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h3 className="font-bold">7. ADDITIONAL CLAUSES</h3>
            <textarea
              value={customClauses}
              onChange={(e) => setCustomClauses(e.target.value)}
              placeholder="Enter any additional clauses here..."
              rows={4}
              className="mt-2 w-full rounded border border-neutral-300 bg-white p-2 text-sm"
            />
          </section>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <LeaseAgreementPDFDownload
          tenancy={tenancy}
          propertyAddress={propertyAddress}
          landlordName={landlordName}
          customClauses={customClauses}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {({ loading }) => (
            <>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {loading ? "Generating..." : "Download PDF"}
            </>
          )}
        </LeaseAgreementPDFDownload>

        <button
          onClick={handleSaveToDocuments}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSaving ? "Saving..." : "Save to Documents"}
        </button>
      </div>
    </div>
  );
}
