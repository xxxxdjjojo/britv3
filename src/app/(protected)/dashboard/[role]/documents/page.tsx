"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Upload,
  Shield,
  Clock,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { useDocuments, useUploadDocument, useDeleteDocument } from "@/hooks/useDocuments";
import type { UserDocument, DocumentType } from "@/services/documents/documents-service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type TabFilter = "all" | "aip_letter" | "proof_of_funds" | "id_proof" | "other";

const TAB_LABELS: Record<TabFilter, string> = {
  all: "All Documents",
  aip_letter: "AIP Letters",
  proof_of_funds: "Proof of Funds",
  id_proof: "ID Proof",
  other: "Other",
};

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  aip_letter: "AIP Letter",
  proof_of_funds: "Proof of Funds",
  id_proof: "ID Proof",
  other: "Other",
};

function getStatusBadge(status: UserDocument["status"]) {
  switch (status) {
    case "verified":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <Shield className="mr-1 size-3" />
          Verified
        </Badge>
      );
    case "pending_review":
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
          Pending Review
        </Badge>
      );
    case "uploaded":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          Uploaded
        </Badge>
      );
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function filterDocuments(
  documents: UserDocument[],
  tab: TabFilter,
): UserDocument[] {
  if (tab === "all") return documents;
  return documents.filter((d) => d.document_type === tab);
}

// ---------------------------------------------------------------------------
// Upload dialog
// ---------------------------------------------------------------------------

function UploadDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>("other");
  const [offerId, setOfferId] = useState("");
  const upload = useUploadDocument();

  function handleSubmit() {
    if (!file) return;
    upload.mutate(
      { file, documentType, offerId: offerId.trim() || undefined },
      {
        onSuccess: () => {
          setOpen(false);
          setFile(null);
          setDocumentType("other");
          setOfferId("");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 size-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Accepted formats: PDF, JPEG, PNG, Word (.doc, .docx). Max 50 MB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="doc-file">File</Label>
            <Input
              id="doc-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-type">Document Type</Label>
            <Select
              value={documentType}
              onValueChange={(v) => setDocumentType(v as DocumentType)}
            >
              <SelectTrigger id="doc-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aip_letter">AIP Letter</SelectItem>
                <SelectItem value="proof_of_funds">Proof of Funds</SelectItem>
                <SelectItem value="id_proof">ID Proof</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="offer-id">
              Offer ID{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="offer-id"
              placeholder="Link to an offer…"
              value={offerId}
              onChange={(e) => setOfferId(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!file || upload.isPending}
          >
            {upload.isPending ? "Uploading…" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Documents table
// ---------------------------------------------------------------------------

function DocumentsTable({ documents }: { documents: UserDocument[] }) {
  const deleteDoc = useDeleteDocument();

  async function handleDownload(doc: UserDocument) {
    try {
      const res = await fetch(`/api/documents/${doc.id}/download`);
      if (!res.ok) throw new Error("Could not generate download link");
      const { url } = (await res.json()) as { url: string };
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // toast already shown via global error boundary; log for debug
      console.error("Download error for document", doc.id);
    }
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <FileText className="size-10 opacity-40" />
          <p className="text-sm">No documents found.</p>
          <p className="text-xs">Upload your first document using the button above.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
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
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-muted-foreground" />
                    <span className="font-medium">{doc.file_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {DOCUMENT_TYPE_LABELS[doc.document_type]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="size-3" />
                    {formatDate(doc.created_at)}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatFileSize(doc.file_size_bytes)}
                </TableCell>
                <TableCell>{getStatusBadge(doc.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Download"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete"
                      disabled={deleteDoc.isPending}
                      onClick={() => deleteDoc.mutate(doc.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function DocumentsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-md" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DocumentsPage() {
  const { data: documents, isLoading, isError } = useDocuments();
  const [activeTab, setActiveTab] = useState<TabFilter>("all");

  const allDocs = documents ?? [];
  const verified = allDocs.filter((d) => d.status === "verified").length;
  const pending = allDocs.filter(
    (d) => d.status === "pending_review" || d.status === "uploaded",
  ).length;
  const rejected = allDocs.filter((d) => d.status === "rejected").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Document Vault</h1>
          <p className="text-muted-foreground">
            Securely store and manage your property documents
          </p>
        </div>
        <UploadDialog />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Documents</CardDescription>
            <CardTitle className="text-3xl">
              {isLoading ? <Skeleton className="h-9 w-10" /> : allDocs.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Verified</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {isLoading ? <Skeleton className="h-9 w-10" /> : verified}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-3xl text-amber-600">
              {isLoading ? <Skeleton className="h-9 w-10" /> : pending}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rejected</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {isLoading ? <Skeleton className="h-9 w-10" /> : rejected}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Error state */}
      {isError && (
        <Card>
          <CardContent className="flex items-center gap-3 py-6 text-destructive">
            <AlertCircle className="size-5" />
            <p className="text-sm">
              Failed to load documents. Please refresh the page.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabs + table */}
      {!isError && (
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabFilter)}
        >
          <TabsList>
            {(Object.keys(TAB_LABELS) as TabFilter[]).map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {TAB_LABELS[tab]}
              </TabsTrigger>
            ))}
          </TabsList>

          {(Object.keys(TAB_LABELS) as TabFilter[]).map((tab) => (
            <TabsContent key={tab} value={tab}>
              {isLoading ? (
                <DocumentsSkeleton />
              ) : (
                <DocumentsTable documents={filterDocuments(allDocs, tab)} />
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
