"use client";

import { useState } from "react";
import { Download, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { PropertyDocument } from "@/types/landlord";
import { getExpiryStatus } from "@/services/landlord/document-service";
import type { ExpiryStatus } from "@/services/landlord/document-service";

type DocumentListProps = Readonly<{
  documents: PropertyDocument[];
  onDeleteComplete?: () => void;
}>;

const CATEGORY_LABELS: Record<string, string> = {
  gas_safety: "Gas Safety",
  electrical_eicr: "Electrical EICR",
  epc: "EPC",
  insurance: "Insurance",
  lease_agreement: "Lease Agreement",
  inventory: "Inventory",
  inspection_report: "Inspection Report",
  receipt: "Receipt",
  other: "Other",
};

const STATUS_CONFIG: Record<
  ExpiryStatus,
  { color: string; label: string }
> = {
  valid: { color: "bg-success", label: "Valid" },
  expiring: { color: "bg-warning", label: "Expiring Soon" },
  expired: { color: "bg-error", label: "Expired" },
  none: { color: "", label: "" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DocumentList({
  documents,
  onDeleteComplete,
}: DocumentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(documentId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this document? This cannot be undone.",
    );
    if (!confirmed) return;

    setDeletingId(documentId);

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 204) {
        const err = await response.json();
        throw new Error(err.error || "Failed to delete document");
      }

      toast.success("Document deleted.");
      onDeleteComplete?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete document";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        No documents uploaded yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Category</th>
            <th className="px-4 py-3 text-left font-medium">Uploaded</th>
            <th className="px-4 py-3 text-left font-medium">Expiry</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {documents.map((doc) => {
            const status = getExpiryStatus(doc.expiry_date);
            const config = STATUS_CONFIG[status];

            return (
              <tr key={doc.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{doc.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {CATEGORY_LABELS[doc.category] ?? doc.category}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(doc.created_at)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {doc.expiry_date ? formatDate(doc.expiry_date) : "--"}
                </td>
                <td className="px-4 py-3">
                  {status !== "none" && (
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${config.color}`}
                        aria-label={config.label}
                      />
                      <span className="text-xs text-muted-foreground">
                        {config.label}
                      </span>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="inline-flex items-center rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
