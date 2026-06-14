"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InsightPanel } from "@/components/dashboard/InsightPanel";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import {
  FileText,
  Upload,
  Eye,
  Trash2,
  ShieldCheck,
  BadgeCheck,
  FolderOpen,
  Fingerprint,
  Banknote,
  Home,
  type LucideIcon,
} from "lucide-react";
import { useDocuments, useUploadDocument, useDeleteDocument } from "@/hooks/useDocuments";
import type { UserDocument, DocumentType } from "@/services/documents/documents-service";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  id_proof: "ID Proof",
  proof_of_funds: "Proof of Funds",
  aip_letter: "AIP Letter",
  other: "Other",
};

const STATUS_LABELS: Record<UserDocument["status"], string> = {
  uploaded: "Uploaded",
  pending_review: "Pending Review",
  verified: "Verified",
  rejected: "Rejected",
};

const STATUS_PILL_CLASSES: Record<UserDocument["status"], string> = {
  uploaded: "bg-muted text-muted-foreground",
  pending_review: "bg-warning/10 text-warning",
  verified: "bg-success/10 text-success",
  rejected: "bg-error/10 text-error",
};

type DropZone = Readonly<{
  type: DocumentType;
  label: string;
  description: string;
  icon: LucideIcon;
}>;

const DROP_ZONES: readonly DropZone[] = [
  {
    type: "id_proof",
    label: "Identity",
    description: "Passport, driving licence, or proof of address.",
    icon: Fingerprint,
  },
  {
    type: "proof_of_funds",
    label: "Financial",
    description: "Proof of funds, bank statements, or mortgage in principle.",
    icon: Banknote,
  },
  {
    type: "aip_letter",
    label: "Property",
    description: "AIP letters, surveys, and property-related paperwork.",
    icon: Home,
  },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(isoString));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DocumentsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType>("other");
  const [isUploading, setIsUploading] = useState(false);

  const { data: documents, isLoading, error } = useDocuments();
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();

  const allDocs = documents ?? [];

  const handleUploadClick = (documentType: DocumentType) => {
    setSelectedDocumentType(documentType);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error("File too large", {
        description: "Please choose a file smaller than 50 MB.",
      });
      event.target.value = "";
      return;
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      toast.error("File type not supported", {
        description: "Please upload a PDF, JPG, PNG, WEBP, DOC, or DOCX file.",
      });
      event.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      await uploadDocument.mutateAsync({ file, documentType: selectedDocumentType });
      toast.success("Document uploaded", {
        description: `${file.name} has been uploaded successfully.`,
      });
    } catch (err) {
      const code = (err as Error & { code?: string }).code;
      if (code === "FILE_TOO_LARGE") {
        toast.error("File too large", { description: "Maximum size is 50 MB." });
      } else if (code === "INVALID_MIME_TYPE") {
        toast.error("File type not allowed");
      } else {
        toast.error("Upload failed", { description: (err as Error).message });
      }
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleDelete = async (documentId: string, fileName: string) => {
    try {
      await deleteDocument.mutateAsync({ documentId });
      toast.success("Document deleted", { description: fileName });
    } catch {
      toast.error("Failed to delete document");
    }
  };

  return (
    <div className="space-y-8">
      {/* Heading */}
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-primary-dark md:text-4xl">
          Document Vault
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Manage your essential documentation with institutional-grade security. Your documents are
          encrypted and only shared with your consent.
        </p>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
        onChange={handleFileChange}
      />

      {/* Category drop-zones */}
      <div className="grid gap-4 md:grid-cols-3">
        {DROP_ZONES.map((zone) => {
          const Icon = zone.icon;
          return (
            <div
              key={zone.type}
              className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                  <Icon className="size-5" />
                </span>
                <h2 className="font-heading text-lg font-bold text-brand-primary-dark">
                  {zone.label}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">{zone.description}</p>
              <button
                type="button"
                onClick={() => handleUploadClick(zone.type)}
                disabled={isUploading}
                aria-label={`Upload ${zone.label} document`}
                className="group flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-brand-primary/60 hover:bg-brand-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Upload className="size-6 text-muted-foreground transition-colors group-hover:text-brand-primary" />
                <span className="text-sm font-medium text-brand-primary-dark">
                  {isUploading ? "Uploading…" : "Drop file to upload"}
                </span>
                <span className="text-xs text-muted-foreground">
                  PDF, JPG, or PNG up to 50 MB
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Recent uploads */}
      <section className="space-y-4">
        <SectionHeader title="Recent Uploads" />

        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {error ? (
            <div className="py-10 text-center text-sm text-error">
              Failed to load documents. Please refresh the page.
            </div>
          ) : isLoading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : allDocs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <FolderOpen className="mx-auto mb-4 size-12 opacity-40" />
              <p className="text-sm">
                No documents uploaded yet. Use a category above to add your first document.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Document
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Category
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Size
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Date
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Status
                    </th>
                    <th scope="col" className="px-5 py-3 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                            <FileText className="size-4" />
                          </span>
                          <span className="font-medium text-brand-primary-dark">
                            {doc.file_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {DOCUMENT_TYPE_LABELS[doc.document_type]}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {formatBytes(doc.file_size_bytes)}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {formatDate(doc.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.04em] ${STATUS_PILL_CLASSES[doc.status]}`}
                        >
                          {STATUS_LABELS[doc.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" aria-label="View document">
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete document"
                            onClick={() => handleDelete(doc.id, doc.file_name)}
                            disabled={deleteDocument.isPending}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Privacy & encryption */}
      <InsightPanel
        title="Privacy & Encryption"
        eyebrow="Institutional-grade security"
        icon={ShieldCheck}
        action={{ label: "Review Security Policy", href: "/legal/privacy" }}
      >
        <p>
          We utilise AES-256 bit encryption at rest and TLS 1.3 in transit. Your private documents
          are never visible to third parties without your explicit, timestamped digital signature.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.06em] text-white">
            <ShieldCheck className="size-3.5 text-brand-gold" />
            Encrypted
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.06em] text-white">
            <BadgeCheck className="size-3.5 text-brand-gold" />
            GDPR-Compliant
          </span>
        </div>
      </InsightPanel>
    </div>
  );
}
