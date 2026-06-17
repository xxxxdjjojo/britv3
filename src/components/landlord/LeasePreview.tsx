"use client";

import { useState, useCallback } from "react";
import { Download, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Tenancy } from "@/types/landlord";

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const generatePDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    function checkPageBreak(needed: number) {
      if (y + needed > 270) {
        doc.addPage();
        y = 20;
      }
    }

    function addSectionTitle(title: string) {
      checkPageBreak(20);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(title, margin, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    }

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Assured Shorthold Tenancy Agreement", pageWidth / 2, y, {
      align: "center",
    });
    y += 12;

    // Disclaimer
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150, 0, 0);
    doc.text(
      "DISCLAIMER: This template is for guidance only. Seek legal advice before use.",
      pageWidth / 2,
      y,
      { align: "center" },
    );
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    y += 12;

    // Section 1: PARTIES
    addSectionTitle("1. PARTIES");
    doc.text(`Landlord: ${landlordName}`, margin + 5, y);
    y += 6;
    doc.text(`Tenant: ${tenancy.tenant_name}`, margin + 5, y);
    y += 6;
    const addressLines = doc.splitTextToSize(
      `Property: ${propertyAddress}`,
      maxWidth - 5,
    );
    doc.text(addressLines, margin + 5, y);
    y += addressLines.length * 5 + 6;

    // Section 2: TERM
    addSectionTitle("2. TERM");
    doc.text(`Start Date: ${tenancy.lease_start_date}`, margin + 5, y);
    y += 6;
    if (tenancy.lease_end_date) {
      doc.text(`End Date: ${tenancy.lease_end_date}`, margin + 5, y);
      y += 6;
    } else {
      doc.text("End Date: Periodic (rolling)", margin + 5, y);
      y += 6;
    }
    y += 4;

    // Section 3: RENT
    addSectionTitle("3. RENT");
    doc.text(
      `Amount: GBP ${tenancy.rent_amount.toLocaleString("en-GB", { minimumFractionDigits: 2 })} per ${tenancy.rent_frequency === "monthly" ? "calendar month" : "week"}`,
      margin + 5,
      y,
    );
    y += 6;
    doc.text("Payment Method: Bank transfer or standing order", margin + 5, y);
    y += 10;

    // Section 4: DEPOSIT
    addSectionTitle("4. DEPOSIT");
    if (tenancy.deposit_amount) {
      doc.text(
        `Amount: GBP ${tenancy.deposit_amount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`,
        margin + 5,
        y,
      );
      y += 6;
      if (tenancy.deposit_scheme) {
        doc.text(`Scheme: ${tenancy.deposit_scheme}`, margin + 5, y);
        y += 6;
      }
    } else {
      doc.text("No deposit required.", margin + 5, y);
      y += 6;
    }
    y += 4;

    // Section 5: OBLIGATIONS
    addSectionTitle("5. OBLIGATIONS");

    doc.setFont("helvetica", "bold");
    doc.text("Landlord's Obligations:", margin + 5, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    for (const obligation of LANDLORD_OBLIGATIONS) {
      checkPageBreak(10);
      const lines = doc.splitTextToSize(`- ${obligation}`, maxWidth - 10);
      doc.text(lines, margin + 10, y);
      y += lines.length * 5 + 2;
    }
    y += 4;

    doc.setFont("helvetica", "bold");
    doc.text("Tenant's Obligations:", margin + 5, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    for (const obligation of TENANT_OBLIGATIONS) {
      checkPageBreak(10);
      const lines = doc.splitTextToSize(`- ${obligation}`, maxWidth - 10);
      doc.text(lines, margin + 10, y);
      y += lines.length * 5 + 2;
    }
    y += 4;

    // Section 6: NOTICES
    checkPageBreak(30);
    addSectionTitle("6. NOTICES");
    doc.text(
      "The Landlord must give at least two months' notice to end the tenancy (Section 21).",
      margin + 5,
      y,
    );
    y += 6;
    doc.text(
      "The Tenant must give at least one month's notice to end the tenancy.",
      margin + 5,
      y,
    );
    y += 6;
    doc.text(
      "All notices must be in writing and served to the addresses stated in this agreement.",
      margin + 5,
      y,
    );
    y += 10;

    // Section 7: ADDITIONAL CLAUSES
    if (customClauses.trim()) {
      checkPageBreak(20);
      addSectionTitle("7. ADDITIONAL CLAUSES");
      const clauseLines = doc.splitTextToSize(customClauses, maxWidth - 5);
      checkPageBreak(clauseLines.length * 5 + 10);
      doc.text(clauseLines, margin + 5, y);
      y += clauseLines.length * 5 + 10;
    }

    // Signature lines
    checkPageBreak(40);
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("SIGNATURES", margin, y);
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.text("Landlord: ____________________________", margin, y);
    y += 6;
    doc.text("Date: ____________________________", margin, y);
    y += 10;
    doc.text("Tenant: ____________________________", margin, y);
    y += 6;
    doc.text("Date: ____________________________", margin, y);

    return doc;
  }, [tenancy, propertyAddress, landlordName, customClauses]);

  async function handleDownload() {
    setIsGenerating(true);
    try {
      const doc = await generatePDF();
      doc.save(`lease-${tenancy.id}.pdf`);
      toast.success("Lease PDF downloaded.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate PDF";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSaveToDocuments() {
    setIsSaving(true);
    try {
      const doc = await generatePDF();
      const blob = doc.output("blob");
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
      <div className="rounded-lg border border-border bg-white p-8 text-black dark:bg-surface">
        <h2 className="text-center text-xl font-bold">
          Assured Shorthold Tenancy Agreement
        </h2>

        <div className="mx-auto mt-4 max-w-lg rounded border border-red-300 bg-red-50 p-3 text-center text-sm text-red-700">
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
              className="mt-2 w-full rounded border border-gray-300 bg-white p-2 text-sm"
            />
          </section>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isGenerating ? "Generating..." : "Download PDF"}
        </button>

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
