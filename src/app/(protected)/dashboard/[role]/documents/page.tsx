"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Upload,
  Eye,
  Trash2,
  Shield,
  Clock,
  FolderOpen,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
  CreditCard,
  IdCard,
  Folder,
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

type DocTypeConfig = {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

const DOCUMENT_TYPES: Record<DocumentType, DocTypeConfig> = {
  id_proof: {
    label: "ID Proof",
    description: "Passport, driving licence, or national ID",
    icon: IdCard,
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
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

const STATUS_CONFIG: Record<UserDocument["status"], StatusConfig> = {
  uploaded: {
    label: "Uploaded",
    badgeClass: "bg-neutral-100 text-neutral-600 border-0",
    icon: Clock,
  },
  pending_review: {
    label: "Pending Review",
    badgeClass: "bg-warning-light text-warning border-0",
    icon: Clock,
  },
  verified: {
    label: "Verified",
    badgeClass: "bg-success-light text-success border-0",
    icon: Shield,
  },
  rejected: {
    label: "Rejected",
    badgeClass: "bg-error-light text-error border-0",
    icon: XCircle,
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

function fileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toUpperCase() ?? "FILE";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DocumentCard({
  doc,
  onDelete,
  isDeleting,
}: Readonly<{
  doc: UserDocument;
  onDelete: (id: string, name: string) => void;
  isDeleting: boolean;
}>) {
  const statusConfig = STATUS_CONFIG[doc.status];
  const StatusIcon = statusConfig.icon;
  const ext = fileExtension(doc.file_name);

  return (
    <div className="flex items-start gap-4 rounded-xl bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* File icon */}
      <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-neutral-50">
        <FileText strokeWidth={1.25} className="size-5 text-neutral-400" />
        <span className="mt-0.5 text-[9px] font-bold uppercase text-neutral-400">
          {ext}
        </span>
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
        <p className="truncate text-sm font-semibold text-neutral-900">
          {doc.file_name}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" strokeWidth={1.25} />
            {formatDate(doc.created_at)}
          </span>
          <span>{formatBytes(doc.file_size_bytes)}</span>
          <Badge variant="outline" className="h-4 border-neutral-200 px-1.5 py-0 text-[10px]">
            {DOCUMENT_TYPES[doc.document_type].label}
          </Badge>
        </div>
      </div>

      {/* Status */}
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.badgeClass}`}
        >
          <StatusIcon className="size-3" strokeWidth={1.25} />
          {statusConfig.label}
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label={`View ${doc.file_name}`}
          >
            <Eye className="size-3.5" strokeWidth={1.25} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-neutral-400 hover:text-destructive"
            aria-label={`Delete ${doc.file_name}`}
            onClick={() => onDelete(doc.id, doc.file_name)}
            disabled={isDeleting}
          >
            <Trash2 className="size-3.5" strokeWidth={1.25} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptyCategory({ type }: Readonly<{ type: DocumentType }>) {
  const config = DOCUMENT_TYPES[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-neutral-50 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-neutral-100">
        <Icon className="size-6 text-neutral-400" strokeWidth={1.25} />
      </div>
      <div>
        <p className="font-medium text-neutral-900">No {config.label} documents</p>
        <p className="mt-1 text-sm text-neutral-500">{config.description}</p>
      </div>
    </div>
  );
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
  const verifiedCount = allDocs.filter((d) => d.status === "verified").length;
  const pendingCount = allDocs.filter((d) => d.status === "pending_review").length;
  const rejectedCount = allDocs.filter((d) => d.status === "rejected").length;

  const docsByType = (type: DocumentType) =>
    allDocs.filter((d) => d.document_type === type);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className="flex flex-col gap-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 font-['Plus_Jakarta_Sans']">
            Document Vault
          </h1>
          <p className="text-sm text-neutral-500">
            Securely store and manage your property documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedDocumentType}
            onValueChange={(v) => setSelectedDocumentType(v as DocumentType)}
          >
            <SelectTrigger className="h-9 w-40 text-sm" aria-label="Select document type">
              <SelectValue placeholder="Document type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id_proof">ID Proof</SelectItem>
              <SelectItem value="proof_of_funds">Proof of Funds</SelectItem>
              <SelectItem value="aip_letter">AIP Letter</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="bg-brand-primary hover:bg-brand-primary-light"
          >
            {isUploading ? (
              <Loader2 className="mr-2 size-4 animate-spin" strokeWidth={1.25} />
            ) : (
              <Upload className="mr-2 size-4" strokeWidth={1.25} />
            )}
            {isUploading ? "Uploading…" : "Upload"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
            onChange={handleFileChange}
            aria-label="Upload document"
          />
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-50">
              <FolderOpen strokeWidth={1.25} className="size-4 text-neutral-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Total</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-6 w-8" />
              ) : (
                <p className="text-xl font-bold text-neutral-900">{allDocs.length}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success-light">
              <CheckCircle2 strokeWidth={1.25} className="size-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Verified</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-6 w-8" />
              ) : (
                <p className="text-xl font-bold text-neutral-900">{verifiedCount}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning-light">
              <Clock strokeWidth={1.25} className="size-4 text-warning" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Pending</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-6 w-8" />
              ) : (
                <p className="text-xl font-bold text-neutral-900">{pendingCount}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-error-light">
              <XCircle strokeWidth={1.25} className="size-4 text-error" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Rejected</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-6 w-8" />
              ) : (
                <p className="text-xl font-bold text-neutral-900">{rejectedCount}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Security notice ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 rounded-xl bg-neutral-50 px-4 py-3">
        <Lock className="size-4 shrink-0 text-neutral-400" strokeWidth={1.25} />
        <p className="text-xs text-neutral-500">
          All documents are end-to-end encrypted and stored securely. Only you and
          authorised parties can access them.
        </p>
      </div>

      {/* ── Error ───────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-error-light px-4 py-3 text-sm text-error">
          <AlertCircle className="size-4 shrink-0" strokeWidth={1.25} />
          Failed to load documents. Please refresh the page.
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <Tabs defaultValue="all">
        <TabsList className="h-10 bg-neutral-100 p-1">
          <TabsTrigger value="all" className="text-sm">
            All
            {allDocs.length > 0 && (
              <span className="ml-1.5 rounded-full bg-neutral-300 px-1.5 py-0.5 text-xs text-neutral-700">
                {allDocs.length}
              </span>
            )}
          </TabsTrigger>
          {(["id_proof", "proof_of_funds", "aip_letter", "other"] as DocumentType[]).map(
            (type) => (
              <TabsTrigger key={type} value={type} className="text-sm">
                {DOCUMENT_TYPES[type].label}
                {docsByType(type).length > 0 && (
                  <span className="ml-1.5 rounded-full bg-neutral-300 px-1.5 py-0.5 text-xs text-neutral-700">
                    {docsByType(type).length}
                  </span>
                )}
              </TabsTrigger>
            ),
          )}
        </TabsList>

        {/* All docs tab */}
        <TabsContent value="all" className="mt-4">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : allDocs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-neutral-50 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-neutral-100">
                <FolderOpen strokeWidth={1.25} className="size-7 text-neutral-400" />
              </div>
              <div>
                <p className="font-medium text-neutral-900">No documents yet</p>
                <p className="mt-1 text-sm text-neutral-500">
                  Upload documents to keep everything in one secure place
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleUploadClick}
              >
                <Upload className="mr-1.5 size-4" strokeWidth={1.25} />
                Upload your first document
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {allDocs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onDelete={handleDelete}
                  isDeleting={deleteDocument.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Per-type tabs */}
        {(["id_proof", "proof_of_funds", "aip_letter", "other"] as DocumentType[]).map(
          (type) => (
            <TabsContent key={type} value={type} className="mt-4">
              {isLoading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                  ))}
                </div>
              ) : docsByType(type).length === 0 ? (
                <EmptyCategory type={type} />
              ) : (
                <div className="flex flex-col gap-3">
                  {docsByType(type).map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      onDelete={handleDelete}
                      isDeleting={deleteDocument.isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ),
        )}
      </Tabs>
    </div>
  );
}
