"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Upload,
  Eye,
  Trash2,
  Shield,
  FolderOpen,
  AlertCircle,
  Loader2,
  Lock,
  UserCheck,
  CreditCard,
  Folder,
  MoreVertical,
  Fingerprint,
  Home,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useDocuments, useUploadDocument, useDeleteDocument } from "@/hooks/useDocuments";
import type { UserDocument, DocumentType } from "@/services/documents/documents-service";
import { cn } from "@/lib/utils";

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

type DocCategoryConfig = {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  priority: string;
  uploadLabel: string;
  uploadSub: string;
};

const DOCUMENT_CATEGORIES: Record<
  "identity" | "financial" | "property",
  DocCategoryConfig
> = {
  identity: {
    label: "Identity",
    description:
      "Passports, drivers licences, or government IDs for AML compliance.",
    icon: Fingerprint,
    priority: "Priority: High",
    uploadLabel: "Drop file to upload",
    uploadSub: "PDF, JPG up to 10MB",
  },
  financial: {
    label: "Financial",
    description:
      "Proof of funds, bank statements, or mortgage in principle letters.",
    icon: CreditCard,
    priority: "Awaiting Proof",
    uploadLabel: "Upload Statement",
    uploadSub: "Direct bank sync available",
  },
  property: {
    label: "Property",
    description: "Solicitor details, previous property sale records, or chains.",
    icon: Home,
    priority: "Optional",
    uploadLabel: "Browse Files",
    uploadSub: "Multi-select enabled",
  },
};

// Map DocumentType → category bucket
const TYPE_TO_CATEGORY: Record<
  DocumentType,
  "identity" | "financial" | "property"
> = {
  id_proof: "identity",
  proof_of_funds: "financial",
  aip_letter: "financial",
  other: "property",
};

type DocTypeConfig = {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

const DOCUMENT_TYPES: Record<DocumentType, DocTypeConfig> = {
  id_proof: {
    label: "ID Proof",
    description: "Passport, driving licence, or national ID",
    icon: UserCheck,
  },
  proof_of_funds: {
    label: "Proof of Funds",
    description: "Bank statements or mortgage in principle",
    icon: CreditCard,
  },
  aip_letter: {
    label: "AIP Letter",
    description: "Agreement in principle from your lender",
    icon: FileText,
  },
  other: {
    label: "Other",
    description: "Any other supporting documents",
    icon: Folder,
  },
};

type StatusConfig = {
  label: string;
  badgeClass: string;
};

const STATUS_CONFIG: Record<UserDocument["status"], StatusConfig> = {
  uploaded: {
    label: "Uploaded",
    badgeClass: "bg-zinc-100 text-zinc-600",
  },
  pending_review: {
    label: "Under Review",
    badgeClass: "bg-[#fdcd74] text-[#785601]",
  },
  verified: {
    label: "Verified",
    badgeClass: "bg-emerald-100 text-emerald-800",
  },
  rejected: {
    label: "Rejected",
    badgeClass: "bg-[#ffdad6] text-[#93000a]",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
// Upload category card
// ---------------------------------------------------------------------------

function UploadCategoryCard({
  category,
  onUpload,
  isUploading,
}: Readonly<{
  category: "identity" | "financial" | "property";
  onUpload: (type: DocumentType) => void;
  isUploading: boolean;
}>) {
  const config = DOCUMENT_CATEGORIES[category];
  const Icon = config.icon;
  const docType: DocumentType =
    category === "identity"
      ? "id_proof"
      : category === "financial"
        ? "proof_of_funds"
        : "other";

  return (
    <section className="bg-[#f4f3f2] p-7 rounded-2xl transition-all hover:bg-[#eeeeed] group">
      <div className="flex items-center justify-between mb-7">
        <div className="p-3 bg-white rounded-xl">
          <Icon className="size-5 text-[#003629]" strokeWidth={1.25} />
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] font-['Inter'] text-zinc-500">
          {config.priority}
        </span>
      </div>
      <h3 className="text-xl font-['Plus_Jakarta_Sans'] font-bold mb-2 text-[#1a1c1c]">
        {config.label}
      </h3>
      <p className="text-sm text-zinc-500 mb-7 leading-relaxed">
        {config.description}
      </p>
      <button
        className="w-full border-2 border-dashed border-zinc-300 rounded-xl p-7 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#003629]/40 transition-colors group/drop"
        onClick={() => onUpload(docType)}
        disabled={isUploading}
        aria-label={`Upload ${config.label} document`}
      >
        {isUploading ? (
          <Loader2
            className="size-7 text-[#003629] mb-2 animate-spin"
            strokeWidth={1.25}
          />
        ) : (
          <Upload className="size-7 text-[#003629] mb-2" strokeWidth={1.25} />
        )}
        <span className="text-sm font-medium text-[#1a1c1c]">
          {config.uploadLabel}
        </span>
        <span className="text-xs text-zinc-500 mt-1">{config.uploadSub}</span>
      </button>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Document table row
// ---------------------------------------------------------------------------

function DocumentTableRow({
  doc,
  onDelete,
  isDeleting,
}: Readonly<{
  doc: UserDocument;
  onDelete: (id: string, name: string) => void;
  isDeleting: boolean;
}>) {
  const statusConfig = STATUS_CONFIG[doc.status];
  const typeConfig = DOCUMENT_TYPES[doc.document_type];
  const category = TYPE_TO_CATEGORY[doc.document_type];

  const iconBg =
    doc.status === "rejected"
      ? "bg-[#ffdad6]/20"
      : doc.status === "pending_review"
        ? "bg-[#fdcd74]/20"
        : "bg-[#1b4d3e]/10";

  const iconColor =
    doc.status === "rejected"
      ? "text-[#93000a]"
      : doc.status === "pending_review"
        ? "text-[#7b5804]"
        : "text-[#1b4d3e]";

  return (
    <tr className="hover:bg-[#f4f3f2]/50 transition-colors">
      <td className="px-7 py-5">
        <div className="flex items-center gap-4">
          <div
            className={`w-10 h-12 ${iconBg} rounded flex items-center justify-center shrink-0`}
          >
            <FileText className={`size-5 ${iconColor}`} strokeWidth={1.25} />
          </div>
          <div>
            <div className="text-sm font-bold text-[#1a1c1c]">{doc.file_name}</div>
            <div className="text-xs text-zinc-500 mt-0.5">
              {typeConfig.description}
            </div>
          </div>
        </div>
      </td>
      <td className="px-7 py-5 text-sm text-zinc-500 font-['Inter'] capitalize">
        {category}
      </td>
      <td className="px-7 py-5 text-sm text-zinc-500 font-['Inter']">
        {formatBytes(doc.file_size_bytes)}
      </td>
      <td className="px-7 py-5 text-sm text-zinc-500 font-['Inter']">
        {formatDate(doc.created_at)}
      </td>
      <td className="px-7 py-5">
        <span
          className={cn(
            "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
            statusConfig.badgeClass,
          )}
        >
          {statusConfig.label}
        </span>
      </td>
      <td className="px-7 py-5 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            className="p-1.5 text-zinc-400 hover:text-[#003629] transition-colors rounded-lg hover:bg-[#f4f3f2]"
            aria-label={`View ${doc.file_name}`}
          >
            <Eye className="size-4" strokeWidth={1.25} />
          </button>
          <button
            className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
            onClick={() => onDelete(doc.id, doc.file_name)}
            disabled={isDeleting}
            aria-label={`Delete ${doc.file_name}`}
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={1.25} />
            ) : (
              <Trash2 className="size-4" strokeWidth={1.25} />
            )}
          </button>
          <button
            className="p-1.5 text-zinc-400 hover:text-[#1a1c1c] transition-colors rounded-lg hover:bg-[#f4f3f2]"
            aria-label="More options"
          >
            <MoreVertical className="size-4" strokeWidth={1.25} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DocumentsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocumentType, setSelectedDocumentType] =
    useState<DocumentType>("other");
  const [isUploading, setIsUploading] = useState(false);

  const { data: documents, isLoading, error } = useDocuments();
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();

  const allDocs = documents ?? [];

  const handleCategoryUpload = (type: DocumentType) => {
    setSelectedDocumentType(type);
    fileInputRef.current?.click();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
      await uploadDocument.mutateAsync({
        file,
        documentType: selectedDocumentType,
      });
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
        toast.error("Upload failed", {
          description: (err as Error).message,
        });
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
    <div className="min-h-screen bg-[#faf9f8] text-[#1a1c1c]">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
        onChange={handleFileChange}
        aria-label="Upload document"
      />

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="mb-12">
        <h1 className="font-['Plus_Jakarta_Sans'] text-4xl md:text-5xl font-extrabold tracking-tight text-[#1a1c1c] mb-4">
          Document Vault
        </h1>
        <p className="text-zinc-500 max-w-2xl leading-relaxed text-base font-['Inter']">
          Manage your essential documentation with institutional-grade security.{" "}
          <span className="block mt-2 text-sm font-medium text-[#1b4d3e]">
            Your documents are encrypted and only shared with your consent.
          </span>
        </p>
      </div>

      {/* ── Error ───────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 mb-8">
          <AlertCircle className="size-4 shrink-0" strokeWidth={1.25} />
          Failed to load documents. Please refresh the page.
        </div>
      )}

      {/* ── Category upload cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {(["identity", "financial", "property"] as const).map((cat) => (
          <UploadCategoryCard
            key={cat}
            category={cat}
            onUpload={handleCategoryUpload}
            isUploading={isUploading}
          />
        ))}
      </div>

      {/* ── Recent Uploads table ─────────────────────────────────── */}
      <section className="bg-white rounded-3xl overflow-hidden shadow-[0_4px_32px_rgba(26,28,28,0.04)]">
        <div className="px-7 py-8 flex items-center justify-between">
          <h2 className="text-2xl font-['Plus_Jakarta_Sans'] font-bold text-[#1a1c1c]">
            Recent Uploads
          </h2>
          <div className="flex items-center gap-5">
            <button
              className="flex items-center text-sm text-zinc-500 cursor-pointer hover:text-[#003629] transition-colors gap-2"
              aria-label="Filter documents"
            >
              <Filter className="size-4" strokeWidth={1.25} />
              Filter
            </button>
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-[#003629] text-white text-sm font-semibold rounded-lg hover:bg-[#1b4d3e] transition-colors"
              aria-label="Upload a document"
            >
              {isUploading ? (
                <Loader2 className="size-4 animate-spin" strokeWidth={1.25} />
              ) : (
                <Upload className="size-4" strokeWidth={1.25} />
              )}
              Upload
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f4f3f2]">
                {[
                  "Document Name",
                  "Category",
                  "Size",
                  "Date Uploaded",
                  "Status",
                  "Action",
                ].map((h, i) => (
                  <th
                    key={h}
                    className={cn(
                      "px-7 py-4 text-[10px] uppercase tracking-[0.2em] font-['Inter'] font-bold text-zinc-500",
                      i === 5 && "text-right",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eeeeed]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-7 py-8">
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-14 rounded-xl" />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : allDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-7 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex size-14 items-center justify-center rounded-full bg-[#f4f3f2]">
                        <FolderOpen
                          strokeWidth={1.25}
                          className="size-7 text-zinc-400"
                        />
                      </div>
                      <div>
                        <p className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1a1c1c]">
                          No documents yet
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                          Upload documents to keep everything in one secure place
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                allDocs.map((doc) => (
                  <DocumentTableRow
                    key={doc.id}
                    doc={doc}
                    onDelete={handleDelete}
                    isDeleting={deleteDocument.isPending}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="px-7 py-6 bg-[#f4f3f2]/30 flex items-center justify-between text-sm text-zinc-500">
          <span>
            {isLoading
              ? "Loading…"
              : `Showing ${allDocs.length} document${allDocs.length !== 1 ? "s" : ""}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              className="p-2 hover:bg-[#eeeeed] rounded-lg transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" strokeWidth={1.25} />
            </button>
            <button
              className="p-2 hover:bg-[#eeeeed] rounded-lg transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="size-4" strokeWidth={1.25} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Privacy & Encryption footer banner ─────────────────── */}
      <footer className="mt-16 flex flex-col md:flex-row items-center justify-between p-10 bg-[#1b4d3e] rounded-3xl text-[#8abda9] overflow-hidden relative">
        <div className="relative z-10 max-w-xl">
          <h4 className="text-2xl font-['Plus_Jakarta_Sans'] font-bold text-white mb-3">
            Privacy &amp; Encryption
          </h4>
          <p className="text-[#8abda9] leading-relaxed opacity-90 text-sm font-['Inter']">
            We utilise AES-256 bit encryption at rest and TLS 1.3 in transit.
            Your private documents are never visible to third parties without
            your explicit, timestamped digital signature.
          </p>
          <div className="mt-7 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-emerald-400" strokeWidth={1.25} />
              <span className="text-xs font-['Inter'] uppercase tracking-widest text-white">
                Encrypted
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-emerald-400" strokeWidth={1.25} />
              <span className="text-xs font-['Inter'] uppercase tracking-widest text-white">
                GDPR Compliant
              </span>
            </div>
          </div>
        </div>
        {/* Decorative shield */}
        <div className="hidden md:block absolute right-[-5%] top-[-10%] opacity-10">
          <Shield className="size-64 text-white" strokeWidth={0.25} />
        </div>
        <button
          className="mt-8 md:mt-0 px-7 py-3 bg-[#eec068] text-[#271900] font-bold rounded-xl hover:bg-[#fdcd74] transition-all z-10 text-sm font-['Plus_Jakarta_Sans']"
          aria-label="Review security policy"
        >
          Review Security Policy
        </button>
      </footer>
    </div>
  );
}
