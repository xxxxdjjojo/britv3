"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Upload, X, FileText, Check, Clock, AlertTriangle } from "lucide-react";
import type {
  VerificationDocumentType,
  DocumentVerificationStatus,
  ProviderDocument,
} from "@/types/marketplace";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type DocumentUploadProps = Readonly<{
  existingDocuments?: ProviderDocument[];
  onUploadSuccess?: () => void;
}>;

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const DOCUMENT_TYPE_LABELS: Record<VerificationDocumentType, string> = {
  identity_proof: "Identity Proof",
  qualification_certificate: "Qualification Certificate",
  insurance_certificate: "Insurance Certificate",
  business_registration: "Business Registration",
  dbs_check: "DBS Check",
  reference_letter: "Reference Letter",
  // UK trade credentials (Phase 16)
  gas_safe_certificate: "Gas Safe Certificate",
  niceic_registration: "NICEIC Registration",
  napit_registration: "NAPIT Registration",
  cscs_card: "CSCS Card",
  part_p_certificate: "Part P Certificate",
  acs_qualification: "ACS Qualification",
  public_liability_insurance: "Public Liability Insurance",
};

const STATUS_CONFIG: Record<
  DocumentVerificationStatus,
  { icon: typeof Check; label: string; className: string }
> = {
  pending: {
    icon: Clock,
    label: "Pending",
    className: "bg-warning-light text-warning",
  },
  approved: {
    icon: Check,
    label: "Approved",
    className: "bg-success-light text-success",
  },
  rejected: {
    icon: AlertTriangle,
    label: "Rejected",
    className: "bg-error-light text-error",
  },
  more_info_required: {
    icon: AlertTriangle,
    label: "More Info Required",
    className: "bg-warning-light text-warning",
  },
};

type PendingFile = Readonly<{
  file: File;
  documentType: VerificationDocumentType;
  progress: number;
  uploading: boolean;
}>;

export function DocumentUpload({
  existingDocuments = [],
  onUploadSuccess,
}: DocumentUploadProps) {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: Only PDF, JPEG, PNG, and WebP files are allowed`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File size must be under 10MB`;
    }
    return null;
  }, []);

  function handleFiles(files: FileList | File[]) {
    const fileArray = Array.from(files);
    const newPending: PendingFile[] = [];

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        continue;
      }
      newPending.push({
        file,
        documentType: "identity_proof",
        progress: 0,
        uploading: false,
      });
    }

    if (newPending.length > 0) {
      setPendingFiles((prev) => [...prev, ...newPending]);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function updateFileType(index: number, type: VerificationDocumentType) {
    setPendingFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, documentType: type } : f)),
    );
  }

  function removePendingFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadFile(index: number) {
    const pending = pendingFiles[index];
    if (!pending || pending.uploading) return;

    setPendingFiles((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, uploading: true, progress: 10 } : f,
      ),
    );

    try {
      const formData = new FormData();
      formData.append("file", pending.file);
      formData.append("document_type", pending.documentType);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setPendingFiles((prev) =>
          prev.map((f, i) =>
            i === index && f.progress < 90
              ? { ...f, progress: f.progress + 20 }
              : f,
          ),
        );
      }, 200);

      const response = await fetch("/api/providers/documents/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ?? `Upload failed (${response.status})`,
        );
      }

      setPendingFiles((prev) => prev.filter((_, i) => i !== index));
      toast.success(`${pending.file.name} uploaded successfully`);
      onUploadSuccess?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload document",
      );
      setPendingFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, uploading: false, progress: 0 } : f,
        ),
      );
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload document — click or drag files here"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors",
          isDragging
            ? "border-brand-primary bg-brand-primary-lighter"
            : "border-neutral-200 hover:border-brand-primary/40 hover:bg-neutral-50",
        )}
      >
        <Upload className="mb-3 size-8 text-neutral-400" aria-hidden="true" />
        <p className="text-sm font-medium text-neutral-800">
          Drop files here or click to browse
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          PDF, JPEG, PNG, WebP &mdash; max 10 MB per file
        </p>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          multiple
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Pending Files */}
      {pendingFiles.length > 0 && (
        <div className="space-y-3">
          <Label>Files to Upload</Label>
          {pendingFiles.map((pf, index) => (
            <div
              key={`${pf.file.name}-${index}`}
              className="flex items-center gap-3 rounded-lg border border-border p-3"
            >
              <FileText className="size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {pf.file.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatFileSize(pf.file.size)}
                  </span>
                </div>
                <Select
                  value={pf.documentType}
                  onValueChange={(v) =>
                    updateFileType(index, v as VerificationDocumentType)
                  }
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {pf.uploading && <Progress value={pf.progress} className="h-1" />}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  size="xs"
                  onClick={() => uploadFile(index)}
                  disabled={pf.uploading}
                >
                  {pf.uploading ? "Uploading..." : "Upload"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removePendingFile(index)}
                  disabled={pf.uploading}
                >
                  <X className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Existing Documents */}
      {existingDocuments.length > 0 && (
        <div className="space-y-3">
          <Label>Uploaded Documents</Label>
          {existingDocuments.map((doc) => {
            const statusConfig = STATUS_CONFIG[doc.verification_status];
            const StatusIcon = statusConfig.icon;
            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <FileText className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {doc.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {DOCUMENT_TYPE_LABELS[doc.document_type]} --{" "}
                    {formatFileSize(doc.file_size)}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 gap-1 border-transparent",
                    statusConfig.className,
                  )}
                >
                  <StatusIcon className="size-3" />
                  {statusConfig.label}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
