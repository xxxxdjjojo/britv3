import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CredentialUploadCard } from "@/components/dashboard/provider/CredentialUploadCard";
import type { VerificationDocumentType } from "@/types/marketplace";

export const metadata = {
  title: "Professional Credentials | Provider Dashboard",
};

type DocumentConfig = Readonly<{
  type: VerificationDocumentType;
  label: string;
}>;

const DOCUMENT_CONFIGS: DocumentConfig[] = [
  { type: "identity_proof", label: "Identity Document" },
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

const STATUS_CONFIG = {
  pending: { label: "Under Review", className: "bg-secondary-container/20 text-on-secondary-container border border-secondary-container/30" },
  approved: { label: "Verified", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  rejected: { label: "Rejected", className: "bg-error-container/20 text-on-error-container border border-error-container/30" },
  more_info_required: { label: "More Info Needed", className: "bg-secondary-container/20 text-on-secondary-container border border-secondary-container/30" },
} as const;

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

  const { data: docs } = await supabase
    .from("provider_documents")
    .select("document_type, status, storage_path")
    .eq("provider_id", providerId);

  const docMap = new Map<string, ProviderDocRow>(
    (docs ?? []).map((d) => [d.document_type as string, d as ProviderDocRow]),
  );

  const approvedCount = [...docMap.values()].filter((d) => d.status === "approved").length;
  const totalCount = DOCUMENT_CONFIGS.length;
  const verificationScore = Math.round((approvedCount / totalCount) * 100);

  // Build active records list (uploaded docs)
  const activeRecords = DOCUMENT_CONFIGS.filter(({ type }) => docMap.has(type));

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* Page header */}
      <section className="mb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight leading-none">
              Professional Credentials
            </h1>
            <p className="mt-4 text-on-surface-variant max-w-lg leading-relaxed">
              Manage your verified certifications and legal documentation. Ensuring your profile
              stays compliant maintains your status as a Preferred Estate Provider.
            </p>
          </div>
          <div className="flex gap-4 shrink-0">
            <div className="px-6 py-3 bg-surface-container-low rounded-lg flex flex-col">
              <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                Verification Score
              </span>
              <span className="text-2xl font-headline font-bold text-primary">
                {verificationScore}%
              </span>
            </div>
            <div className="px-6 py-3 bg-primary rounded-lg flex flex-col text-white">
              <span className="text-[10px] uppercase tracking-widest font-bold text-primary-fixed/80">
                Total Documents
              </span>
              <span className="text-2xl font-headline font-bold">{totalCount}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-8">
        {/* Left: Active records */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {/* Filter tabs */}
          <div className="flex items-center justify-between py-4 border-b border-outline-variant/20">
            <h3 className="font-headline font-bold text-lg text-primary">Active Records</h3>
            <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              <Link
                href="#"
                className="text-primary border-b-2 border-primary pb-1"
              >
                All Files
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                Compliance
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                Insurance
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                Training
              </Link>
            </div>
          </div>

          {/* Active records list */}
          <div className="flex flex-col gap-3">
            {activeRecords.length > 0
              ? activeRecords.map(({ type, label }) => {
                  const doc = docMap.get(type);
                  if (!doc) return null;
                  const status = doc.status;
                  const cfg = STATUS_CONFIG[status];
                  const isExpiring = false; // Would compute from expiry date if available
                  const borderColor =
                    status === "approved"
                      ? "border-l-primary/10"
                      : status === "rejected"
                        ? "border-l-error/20"
                        : "border-l-secondary";

                  return (
                    <div
                      key={type}
                      className={[
                        "group bg-surface-container-lowest hover:bg-surface-container-low transition-all duration-300 rounded-xl p-6 flex items-center justify-between border-l-4 shadow-sm",
                        borderColor,
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-6">
                        <div
                          className={[
                            "w-12 h-12 rounded-lg flex items-center justify-center",
                            status === "approved"
                              ? "bg-primary/5 text-primary"
                              : "bg-secondary-fixed-dim/30 text-secondary",
                          ].join(" ")}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-headline font-bold text-on-surface">{label}</h4>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-on-surface-variant">
                              {doc.storage_path ? "Document uploaded" : "No storage path"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div
                          className={[
                            "px-4 py-1.5 rounded-full",
                            cfg.className,
                          ].join(" ")}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {isExpiring ? "Expiring" : cfg.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              : null}

            {/* Empty records become upload cards */}
            {DOCUMENT_CONFIGS.filter(({ type }) => !docMap.has(type)).map(({ type, label }) => (
              <div
                key={type}
                className="group bg-surface-container-low/50 hover:bg-surface-container transition-all duration-300 rounded-xl p-6 flex items-center justify-between border-l-4 border-dashed border-l-error/20 shadow-sm"
              >
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-error-container/10 rounded-lg flex items-center justify-center text-error/40">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-on-surface-variant">{label}</h4>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-on-surface-variant italic">
                        No document on record
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="px-4 py-1.5 bg-error-container/20 rounded-full border border-error-container/30">
                    <span className="text-[10px] font-bold text-on-error-container uppercase tracking-wider">
                      Missing
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Upload section */}
          <div className="pt-8">
            <h3 className="font-headline font-bold text-lg text-primary mb-6">
              Upload New Credential
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {DOCUMENT_CONFIGS.map(({ type, label }) => {
                const existing = docMap.get(type);
                const existingDoc = existing
                  ? {
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
            <p className="mt-4 text-xs text-on-surface-variant">
              Accepted formats: PDF, JPEG, PNG — max 10 MB per file. Documents are securely stored
              and only shared with the Britestate verification team.
            </p>
          </div>
        </div>

        {/* Right: Upload zone + renewal timeline */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
          {/* Renewal Timeline dark card */}
          <div className="bg-primary rounded-2xl p-8 text-white overflow-hidden relative">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary-container rounded-full blur-3xl opacity-50" />
            <div className="relative z-10">
              <h3 className="font-headline font-bold text-lg mb-6">Renewal Timeline</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-secondary ring-4 ring-secondary/20 mt-1.5" />
                    <div className="w-px flex-1 bg-white/20 my-1" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary-fixed/80">
                      Next 30 Days
                    </p>
                    <p className="text-sm font-medium mt-1">Public Liability Renewal</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-white/30 mt-1.5" />
                    <div className="w-px flex-1 bg-white/20 my-1" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                      Next 6 Months
                    </p>
                    <p className="text-sm font-medium mt-1">Health &amp; Safety Assessment</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-white/30 mt-1.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                      March 2025
                    </p>
                    <p className="text-sm font-medium mt-1">Gas Safe Recertification</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance card */}
          <div className="p-6 bg-surface-container-low rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                Compliance Guarantee
              </h4>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed italic">
              &ldquo;Verified credentials increase your likelihood of winning premium estate
              contracts by up to 45% based on provider metrics.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
