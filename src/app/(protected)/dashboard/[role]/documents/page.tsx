"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload, Eye, Trash2, Shield, Clock, FolderOpen } from "lucide-react";
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

function statusVariant(
  status: UserDocument["status"],
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "verified":
      return "default";
    case "rejected":
      return "destructive";
    case "pending_review":
      return "secondary";
    default:
      return "outline";
  }
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

  const docsByType = (type: DocumentType) => allDocs.filter((d) => d.document_type === type);

  const handleUploadClick = () => {
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

  const DocumentRow = ({ doc }: { doc: UserDocument }) => (
    <TableRow key={doc.id}>
      <TableCell>
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          <span className="font-medium">{doc.file_name}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{DOCUMENT_TYPE_LABELS[doc.document_type]}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-sm">
          <Clock className="size-3" />
          {formatDate(doc.created_at)}
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatBytes(doc.file_size_bytes)}
      </TableCell>
      <TableCell>
        <Badge variant={statusVariant(doc.status)}>
          {doc.status === "verified" && <Shield className="mr-1 size-3" />}
          {STATUS_LABELS[doc.status]}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
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
      </TableCell>
    </TableRow>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="py-12 text-center text-muted-foreground">
      <FolderOpen className="mx-auto mb-4 size-12 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Document Vault</h1>
          <p className="text-muted-foreground">
            Securely store and manage your property documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedDocumentType}
            onValueChange={(v) => setSelectedDocumentType(v as DocumentType)}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Document type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id_proof">ID Proof</SelectItem>
              <SelectItem value="proof_of_funds">Proof of Funds</SelectItem>
              <SelectItem value="aip_letter">AIP Letter</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleUploadClick} disabled={isUploading}>
            <Upload className="mr-2 size-4" />
            {isUploading ? "Uploading…" : "Upload Document"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Documents</CardDescription>
            {isLoading ? (
              <Skeleton className="h-9 w-12" />
            ) : (
              <CardTitle className="text-3xl">{allDocs.length}</CardTitle>
            )}
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Verified</CardDescription>
            {isLoading ? (
              <Skeleton className="h-9 w-12" />
            ) : (
              <CardTitle className="text-3xl text-green-600">{verifiedCount}</CardTitle>
            )}
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            {isLoading ? (
              <Skeleton className="h-9 w-12" />
            ) : (
              <CardTitle className="text-3xl text-amber-600">{pendingCount}</CardTitle>
            )}
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rejected</CardDescription>
            {isLoading ? (
              <Skeleton className="h-9 w-12" />
            ) : (
              <CardTitle className="text-3xl text-red-600">{rejectedCount}</CardTitle>
            )}
          </CardHeader>
        </Card>
      </div>

      {error && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-destructive">
            Failed to load documents. Please refresh the page.
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="id_proof">ID Proof</TabsTrigger>
          <TabsTrigger value="proof_of_funds">Proof of Funds</TabsTrigger>
          <TabsTrigger value="aip_letter">AIP Letter</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-4 p-6">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : allDocs.length === 0 ? (
                <EmptyState message="No documents uploaded yet. Use the Upload button to add your first document." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allDocs.map((doc) => (
                      <DocumentRow key={doc.id} doc={doc} />
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {(["id_proof", "proof_of_funds", "aip_letter"] as DocumentType[]).map((type) => (
          <TabsContent key={type} value={type}>
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="space-y-4 p-6">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : docsByType(type).length === 0 ? (
                  <EmptyState
                    message={`No ${DOCUMENT_TYPE_LABELS[type]} documents uploaded yet.`}
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {docsByType(type).map((doc) => (
                        <DocumentRow key={doc.id} doc={doc} />
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
