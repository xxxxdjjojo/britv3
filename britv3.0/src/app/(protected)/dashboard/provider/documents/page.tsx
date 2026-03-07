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
      <div className="py-12 text-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Documents</h1>

      <Card>
        <CardHeader>
          <CardTitle>Verification Documents</CardTitle>
          <CardDescription>
            Upload documents to verify your business. Approved documents help
            build trust with customers and improve your search ranking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUpload
            existingDocuments={documents}
            onUploadSuccess={fetchDocuments}
          />
        </CardContent>
      </Card>
    </div>
  );
}
