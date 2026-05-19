/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Props = Readonly<{
  tenancyId: string;
  propertyId: string;
  tenantName: string;
}>;

export function TenancyAgreementUpload({ tenancyId, propertyId, tenantName }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploading(true);
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) throw new Error("Authentication required");

        // Upload to landlord-documents bucket
        const storagePath = `${user.id}/agreements/${tenancyId}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from("landlord-documents")
          .upload(storagePath, file, { upsert: true });

        if (uploadError) throw new Error(uploadError.message);

        // Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from("landlord-documents")
          .getPublicUrl(storagePath);

        // Record in property_documents table
        const { error: docError } = await supabase.from("property_documents").upsert({
          property_id: propertyId,
          tenancy_id: tenancyId,
          uploaded_by: user.id,
          name: `Tenancy Agreement — ${tenantName}`,
          category: "lease_agreement",
          file_url: urlData.publicUrl,
          file_size: file.size,
        });

        if (docError) {
          console.error("[TenancyAgreementUpload] Failed to record document:", docError);
        }

        toast.success("Tenancy agreement uploaded successfully");
        setUploaded(true);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [tenancyId, propertyId, tenantName],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: uploading || uploaded,
  });

  if (uploaded) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-green-200 dark:border-green-800/30 bg-green-50 dark:bg-green-900/10 p-4">
        <FileCheck className="size-5 text-green-600 dark:text-green-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            Agreement uploaded successfully
          </p>
          <p className="text-xs text-green-600/80 dark:text-green-500/80">
            Saved to landlord documents
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-xs"
          onClick={() => setUploaded(false)}
        >
          Replace
        </Button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
        isDragActive
          ? "border-[#1B4D3E] bg-[#1B4D3E]/5"
          : "border-slate-300 dark:border-slate-600 hover:border-[#1B4D3E]/50 hover:bg-slate-50 dark:hover:bg-slate-800/30"
      } ${uploading ? "pointer-events-none opacity-60" : ""}`}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <>
          <Loader2 className="size-8 animate-spin text-[#1B4D3E] mb-3" />
          <p className="text-sm font-medium">Uploading...</p>
        </>
      ) : (
        <>
          <Upload
            className={`size-8 mb-3 ${isDragActive ? "text-[#1B4D3E]" : "text-muted-foreground"}`}
          />
          <p className="text-sm font-medium">
            {isDragActive ? "Drop the PDF here" : "Drag & drop your PDF here"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">or click to browse — PDF only</p>
        </>
      )}
    </div>
  );
}
