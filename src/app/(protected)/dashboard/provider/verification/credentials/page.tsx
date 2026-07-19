import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CredentialUploadCard } from "@/components/dashboard/provider/CredentialUploadCard";
import type { VerificationDocumentType } from "@/types/marketplace";

export const metadata = {
  title: "Upload Credentials | Provider Dashboard",
};

type DocumentConfig = Readonly<{
  type: VerificationDocumentType;
  label: string;
}>;

const DOCUMENT_CONFIGS: DocumentConfig[] = [
  { type: "public_liability_insurance", label: "Public Liability Insurance" },
  { type: "gas_safe_certificate", label: "Gas Safe Certificate" },
  { type: "niceic_registration", label: "NICEIC Registration" },
  { type: "napit_registration", label: "NAPIT Registration" },
  { type: "cscs_card", label: "CSCS Card" },
  { type: "part_p_certificate", label: "Part P Certificate" },
  { type: "acs_qualification", label: "ACS Qualification" },
];

type ProviderDocRow = {
  document_type: string;
  status: "pending" | "approved" | "rejected" | "more_info_required";
  storage_path: string | null;
};

export default async function CredentialsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.id ?? user.id;

  // Fetch existing documents for this provider
  const { data: docs } = await supabase
    .from("provider_documents")
    .select("document_type, status, storage_path")
    .eq("provider_id", providerId);

  const docMap = new Map<string, ProviderDocRow>(
    (docs ?? []).map((d) => [d.document_type as string, d as ProviderDocRow]),
  );

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      {/* Back link */}
      <Link
        href="/dashboard/provider/verification"
        className="inline-flex items-center gap-1 text-sm font-medium text-neutral-500 hover:text-neutral-900"
      >
        <ChevronLeft className="size-4" />
        Back to Verification Centre
      </Link>

      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Upload Credentials
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Upload the documents relevant to your trade. Only upload documents that
          apply to your services — all uploads are reviewed within 2 business days.
        </p>
      </div>

      {/* Document grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {DOCUMENT_CONFIGS.map(({ type, label }) => {
          const existing = docMap.get(type);

          const existingDoc = existing
            ? {
                // Derive a display filename from storage_path or fall back to a
                // generic label when the path isn't stored in the new schema
                file_name: existing.storage_path
                  ? existing.storage_path.split("/").pop() ?? label
                  : `${label} (uploaded)`,
                status: existing.status,
              }
            : undefined;

          return (
            <CredentialUploadCard
              key={type}
              documentType={type}
              label={label}
              existingDoc={existingDoc}
            />
          );
        })}
      </div>

      {/* Help note */}
      <p className="text-xs text-neutral-400">
        Accepted formats: PDF, JPEG, PNG — max 10 MB per file. Documents are
        securely stored and only shared with the TrueDeed verification team.
      </p>
    </div>
  );
}
