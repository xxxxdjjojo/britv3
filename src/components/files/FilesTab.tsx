"use client";

/**
 * FilesTab -- aggregates attachments from conversation messages.
 * Queries messages with attachments for a given context (listing, booking, rfq).
 * Groups files by type (images, documents) and allows opening in new tab.
 */

import { useCallback, useEffect, useState } from "react";
import { FileImage, FileText, Upload, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { ContextType } from "@/types/messaging";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FileEntry = Readonly<{
  id: string;
  fileName: string;
  fileType: "image" | "pdf" | "unknown";
  sizeBytes: number | null;
  uploadedBy: string | null;
  date: string;
  url: string;
}>;

type FilesTabProps = Readonly<{
  contextType: ContextType;
  contextId: string;
}>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return "--";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extractFileName(url: string): string {
  try {
    const path = new URL(url).pathname;
    const segments = path.split("/");
    return decodeURIComponent(segments[segments.length - 1] || "attachment");
  } catch {
    return "attachment";
  }
}

function inferFileType(url: string, attachmentType: string | null): "image" | "pdf" | "unknown" {
  if (attachmentType === "image") return "image";
  if (attachmentType === "pdf") return "pdf";
  const lower = url.toLowerCase();
  if (/\.(jpe?g|png|gif|webp|svg)/.test(lower)) return "image";
  if (lower.includes(".pdf")) return "pdf";
  return "unknown";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FilesTab({ contextType, contextId }: FilesTabProps) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = useCallback(async () => {
    try {
      // Fetch messages with attachments for this context
      const res = await fetch(
        `/api/messages?context_type=${encodeURIComponent(contextType)}&context_id=${encodeURIComponent(contextId)}&attachments_only=true`,
      );

      if (!res.ok) {
        // If messages API returns 404 (no conversation yet), treat as empty
        if (res.status === 404) {
          setFiles([]);
          return;
        }
        throw new Error("Failed to fetch files");
      }

      const json = await res.json();
      const messages = json.messages ?? [];

      const entries: FileEntry[] = messages
        .filter((m: Record<string, unknown>) => m.attachment_url)
        .map((m: Record<string, unknown>) => ({
          id: m.id as string,
          fileName: extractFileName(m.attachment_url as string),
          fileType: inferFileType(
            m.attachment_url as string,
            m.attachment_type as string | null,
          ),
          sizeBytes: (m.attachment_size_bytes as number) ?? null,
          uploadedBy: (m.sender_name as string) ?? null,
          date: new Date(m.created_at as string).toLocaleDateString("en-GB"),
          url: m.attachment_url as string,
        }));

      setFiles(entries);
    } catch {
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [contextType, contextId]);

  useEffect(() => {
    void fetchFiles();
  }, [fetchFiles]);

  // Group files by type
  const images = files.filter((f) => f.fileType === "image");
  const documents = files.filter((f) => f.fileType !== "image");

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (files.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No files shared yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Files shared in conversations will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Images section */}
      {images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileImage className="h-4 w-4" />
              Images ({images.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileTable files={images} />
          </CardContent>
        </Card>
      )}

      {/* Documents section */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents ({documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileTable files={documents} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// File table sub-component
// ---------------------------------------------------------------------------

function FileTable({ files }: Readonly<{ files: FileEntry[] }>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>File</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Uploaded By</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((file) => (
          <TableRow
            key={file.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => window.open(file.url, "_blank")}
          >
            <TableCell className="font-medium text-sm">
              {file.fileName}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatFileSize(file.sizeBytes)}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {file.uploadedBy ?? "--"}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {file.date}
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
