"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DocumentUpload } from "@/components/provider/DocumentUpload";
import type { ProviderDocument } from "@/types/marketplace";

export default function ProviderDocumentsPage() {
  const [documents, setDocuments] = useState<ProviderDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/providers/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents ?? data ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center py-12 text-sm text-muted-foreground">
        Loading documents...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Credentials &amp; Documents
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Upload and manage your verification documents. Approved credentials
          build client trust and improve your search ranking.
        </p>
      </div>

      {/* Upload card */}
      <Card className="rounded-2xl border-neutral-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-primary-lighter">
              <svg
                className="size-5 text-brand-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-neutral-900">
                Verification Documents
              </CardTitle>
              <CardDescription className="text-sm text-neutral-500">
                PDF, JPEG, PNG, WebP — max 10 MB per file
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <DocumentUpload
            existingDocuments={documents}
            onUploadSuccess={fetchDocuments}
          />
        </CardContent>
      </Card>
    </div>
  );
}
