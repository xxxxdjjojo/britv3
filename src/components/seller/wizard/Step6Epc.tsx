"use client";

import { useState, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { FileText, CheckCircle } from "lucide-react";
import { WizardShell } from "./WizardShell";
import type { SellerListing } from "@/types/seller";
import { createClient } from "@/lib/supabase/client";

type Props = Readonly<{
  listing: Partial<SellerListing> | null;
  listingId: string;
}>;

export function Step6Epc({ listing, listingId }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [epcUrl, setEpcUrl] = useState<string | null>(listing?.epc_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const ext = file.name.split(".").pop() ?? "pdf";
      const path = `listings/${listingId}/epc-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("listing-documents")
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from("listing-documents")
        .getPublicUrl(path);
      setEpcUrl(publicUrl);
    } catch {
      setError("Upload failed. Please try a PDF or image file.");
    } finally {
      setUploading(false);
    }
  }, [listingId, supabase]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [], "image/jpeg": [], "image/png": [] },
    maxFiles: 1,
    disabled: uploading,
  });

  const handleContinue = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/seller/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ epc_url: epcUrl }),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.push(`/dashboard/seller/listings/create?step=7&id=${listingId}`);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <WizardShell
      step={6}
      listingId={listingId}
      onContinue={handleContinue}
      isLoading={saving}
      continueLabel={epcUrl ? "Continue" : "Skip for now"}
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 font-['Plus_Jakarta_Sans']">EPC Certificate</h2>
          <p className="text-neutral-500 text-sm mt-1">
            Upload your Energy Performance Certificate (EPC). Legally required for property sales in England and Wales.
          </p>
        </div>

        {epcUrl ? (
          <div className="flex items-center gap-4 p-5 bg-success-light rounded-2xl border border-success/30">
            <CheckCircle className="text-success flex-shrink-0" size={28} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-success">EPC uploaded successfully</p>
              <a href={epcUrl} target="_blank" rel="noreferrer" className="text-xs text-success hover:underline truncate block">
                View document
              </a>
            </div>
            <button
              type="button"
              onClick={() => setEpcUrl(null)}
              className="text-xs text-neutral-500 hover:text-error"
            >
              Remove
            </button>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-brand-primary bg-brand-primary/5" : "border-neutral-200 hover:border-neutral-300 bg-neutral-50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3 text-neutral-500">
              {uploading ? (
                <div className="h-10 w-10 rounded-full border-2 border-brand-primary/30 border-t-brand-primary animate-spin" />
              ) : (
                <div className="h-14 w-14 rounded-2xl bg-neutral-100 flex items-center justify-center">
                  <FileText size={28} className="text-neutral-400" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-neutral-600">
                  {uploading ? "Uploading..." : "Drop your EPC certificate here"}
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">PDF, JPEG or PNG accepted</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-warning-light rounded-xl p-4 border border-warning/30">
          <p className="text-xs font-semibold text-warning">Why is this required?</p>
          <p className="text-xs text-warning mt-1">
            Under the Energy Performance of Buildings Regulations 2012, sellers must have a valid EPC before marketing a property. You can still proceed without one now, but you&apos;ll need to add it before publishing.
          </p>
        </div>

        {error && <p className="text-error text-sm">{error}</p>}
      </div>
    </WizardShell>
  );
}
