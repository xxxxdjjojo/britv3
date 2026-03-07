"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Upload, FileText, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { validateFileType, MAX_FILE_SIZES } from "@/lib/file-validation";
import { compressImage } from "@/lib/image-compression";
import {
  documentUploadSchema,
  DOCUMENT_CATEGORIES,
} from "@/types/landlord";
import type { DocumentUploadFormData, Tenancy } from "@/types/landlord";

type DocumentUploadProps = Readonly<{
  propertyId: string;
  tenancies?: Tenancy[];
  onUploadComplete?: () => void;
}>;

const CATEGORY_LABELS: Record<string, string> = {
  gas_safety: "Gas Safety Certificate",
  electrical_eicr: "Electrical EICR",
  epc: "Energy Performance Certificate",
  insurance: "Insurance",
  lease_agreement: "Lease Agreement",
  inventory: "Inventory",
  inspection_report: "Inspection Report",
  receipt: "Receipt",
  other: "Other",
};

export default function DocumentUpload({
  propertyId,
  tenancies,
  onUploadComplete,
}: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DocumentUploadFormData>({
    resolver: zodResolver(documentUploadSchema) as never,
    defaultValues: {
      name: "",
      category: "other",
      expiry_date: "",
    },
  });

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type via magic bytes
    const validation = await validateFileType(file);
    if (!validation.valid) {
      toast.error("Only PDF, JPG, and PNG files are allowed.");
      e.target.value = "";
      setSelectedFile(null);
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZES["property-documents"]) {
      toast.error("File size must not exceed 2MB.");
      e.target.value = "";
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }

  async function onSubmit(data: DocumentUploadFormData) {
    if (!selectedFile) {
      toast.error("Please select a file to upload.");
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();

      // Compress images before upload
      let fileToUpload = selectedFile;
      if (
        selectedFile.type.startsWith("image/") ||
        selectedFile.name.match(/\.(jpg|jpeg|png)$/i)
      ) {
        fileToUpload = await compressImage(selectedFile, { maxSizeMB: 1 });
      }

      // Generate a unique document ID for the storage path
      const documentId = crypto.randomUUID();
      const filePath = `${propertyId}/${documentId}/${selectedFile.name}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("property-documents")
        .upload(filePath, fileToUpload, {
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("property-documents").getPublicUrl(filePath);

      // Create document record via API
      const response = await fetch(`/api/properties/${propertyId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          category: data.category,
          expiry_date: data.expiry_date || undefined,
          file_url: publicUrl,
          file_size: fileToUpload.size,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create document record");
      }

      toast.success("Document uploaded successfully.");
      reset();
      setSelectedFile(null);
      onUploadComplete?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload document";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-lg border border-border bg-card p-6"
    >
      <h3 className="text-lg font-semibold">Upload Document</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Document name */}
        <div className="space-y-1">
          <label htmlFor="doc-name" className="text-sm font-medium">
            Document Name
          </label>
          <input
            id="doc-name"
            type="text"
            {...register("name")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="e.g. Gas Safety Certificate 2026"
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-1">
          <label htmlFor="doc-category" className="text-sm font-medium">
            Category
          </label>
          <select
            id="doc-category"
            {...register("category")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {DOCUMENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat] ?? cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-xs text-destructive">
              {errors.category.message}
            </p>
          )}
        </div>

        {/* Expiry date */}
        <div className="space-y-1">
          <label htmlFor="doc-expiry" className="text-sm font-medium">
            Expiry Date (optional)
          </label>
          <input
            id="doc-expiry"
            type="date"
            {...register("expiry_date")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        {/* File input */}
        <div className="space-y-1">
          <label htmlFor="doc-file" className="text-sm font-medium">
            File (PDF, JPG, PNG -- max 2MB)
          </label>
          <input
            id="doc-file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-xs file:text-primary-foreground"
          />
          {selectedFile && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>
      </div>

      {/* Optional tenancy link */}
      {tenancies && tenancies.length > 0 && (
        <div className="space-y-1">
          <label htmlFor="doc-tenancy" className="text-sm font-medium">
            Link to Tenancy (optional)
          </label>
          <select
            id="doc-tenancy"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">None</option>
            {tenancies.map((t) => (
              <option key={t.id} value={t.id}>
                {t.tenant_name} ({t.status})
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={isUploading}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {isUploading ? "Uploading..." : "Upload Document"}
      </button>
    </form>
  );
}
