"use client";

import { useRef, useState } from "react";
import { Upload, CheckCircle, Clock, XCircle, FileText } from "lucide-react";
import type { VerificationDocumentType } from "@/types/marketplace";

const ACCEPTED_MIME = ["application/pdf", "image/jpeg", "image/png"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

type UploadStatus = "idle" | "uploading" | "success" | "error";

type ExistingDoc = Readonly<{
  file_name: string;
  status: "pending" | "approved" | "rejected" | "more_info_required";
}>;

type CredentialUploadCardProps = Readonly<{
  documentType: VerificationDocumentType;
  label: string;
  existingDoc?: ExistingDoc;
}>;

const DOC_STATUS_CONFIG = {
  pending: {
    label: "Under review",
    icon: Clock,
    className: "bg-warning-light text-warning",
  },
  approved: {
    label: "Verified",
    icon: CheckCircle,
    className: "bg-success-light text-success",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className: "bg-error-light text-error",
  },
  more_info_required: {
    label: "More info needed",
    icon: XCircle,
    className: "bg-warning-light text-warning",
  },
} as const;

export function CredentialUploadCard({
  documentType,
  label,
  existingDoc,
}: CredentialUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const statusConfig = existingDoc ? DOC_STATUS_CONFIG[existingDoc.status] : null;
  const displayFileName = uploadedFileName ?? existingDoc?.file_name ?? null;

  async function handleFile(file: File) {
    setErrorMessage(null);

    if (!ACCEPTED_MIME.includes(file.type)) {
      setErrorMessage("Only PDF, JPEG, or PNG files are accepted.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setErrorMessage("File exceeds the 10 MB limit.");
      return;
    }

    setUploadStatus("uploading");
    setUploadedFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", documentType);

      const res = await fetch("/api/providers/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error ?? "Upload failed");
      }

      setUploadStatus("success");
    } catch (err) {
      setUploadStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setUploadedFileName(null);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  const isVerified = existingDoc?.status === "approved" && uploadStatus === "idle";

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-neutral-900">{label}</p>
        {statusConfig && uploadStatus === "idle" && (
          <span
            className={[
              "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
              statusConfig.className,
            ].join(" ")}
          >
            <statusConfig.icon className="size-3" />
            {statusConfig.label}
          </span>
        )}
        {uploadStatus === "success" && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-success-light px-2.5 py-0.5 text-xs font-medium text-success">
            <CheckCircle className="size-3" />
            Uploaded
          </span>
        )}
      </div>

      {/* Existing filename */}
      {displayFileName && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2">
          <FileText className="size-4 shrink-0 text-neutral-400" />
          <span className="truncate text-xs text-neutral-600">{displayFileName}</span>
        </div>
      )}

      {/* Dropzone — hidden when already verified */}
      {!isVerified && (
        <div
          role="button"
          tabIndex={0}
          aria-label={`Upload ${label}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          className={[
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors",
            isDraggingOver
              ? "border-brand-primary bg-brand-primary-lighter"
              : uploadStatus === "uploading"
                ? "border-neutral-200 bg-neutral-50 opacity-60"
                : "border-neutral-200 bg-neutral-50 hover:border-brand-primary hover:bg-brand-primary-lighter",
          ].join(" ")}
        >
          <Upload className="size-5 text-neutral-400" />
          <p className="text-xs text-neutral-500">
            {uploadStatus === "uploading" ? (
              "Uploading…"
            ) : (
              <>
                <span className="font-semibold text-brand-primary">Click to upload</span> or drag &amp;
                drop
                <br />
                PDF, JPEG or PNG — max 10 MB
              </>
            )}
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="sr-only"
        onChange={handleInputChange}
        aria-hidden="true"
      />

      {/* Error */}
      {errorMessage && (
        <p className="mt-2 text-xs text-error">{errorMessage}</p>
      )}
    </div>
  );
}
