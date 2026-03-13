"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Upload, FileText, X, Loader2, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";

// -- Zod schema --------------------------------------------------------------

const uploadCertSchema = z.object({
  property_id: z.string().uuid("Select a property"),
  category: z.enum([
    "gas_safety",
    "electrical_eicr",
    "epc",
    "insurance",
    "lease_agreement",
    "inventory",
  ]),
  expiry_date: z
    .string()
    .min(1, "Expiry date is required")
    .refine(
      (d) => new Date(d) > new Date(),
      "Expiry date must be in the future",
    ),
  document_name: z.string().min(3, "Document name required (min 3 characters)"),
});

type UploadCertFormData = z.infer<typeof uploadCertSchema>;

// -- Types -------------------------------------------------------------------

type Property = {
  id: string;
  address: string;
};

type ComplianceUploadFormProps = Readonly<{
  properties: Property[];
  defaultPropertyId?: string;
  defaultCategory?: string;
}>;

// -- Category metadata -------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  gas_safety: "Gas Safety Certificate (CP12)",
  electrical_eicr: "Electrical Installation Condition Report (EICR)",
  epc: "Energy Performance Certificate (EPC)",
  insurance: "Landlord Insurance",
  lease_agreement: "Lease / Tenancy Agreement",
  inventory: "Inventory Report",
};

const CATEGORY_HINTS: Record<string, { text: string }> = {
  gas_safety: {
    text: "Required annually. Must be carried out by a Gas Safe registered engineer. Give copy to tenant within 28 days.",
  },
  electrical_eicr: {
    text: "Required every 5 years or on change of tenancy. Must be carried out by a qualified electrician.",
  },
  epc: {
    text: "Valid for 10 years. Property must have a minimum E rating to be legally let in England.",
  },
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// -- Component ---------------------------------------------------------------

export default function ComplianceUploadForm({
  properties,
  defaultPropertyId,
  defaultCategory,
}: ComplianceUploadFormProps) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UploadCertFormData>({
    resolver: zodResolver(uploadCertSchema) as never,
    defaultValues: {
      property_id: defaultPropertyId ?? "",
      category: (defaultCategory as UploadCertFormData["category"]) ?? "gas_safety",
      expiry_date: "",
      document_name: "",
    },
  });

  const watchedCategory = watch("category");
  const hint = CATEGORY_HINTS[watchedCategory];

  // -- File drop handler -----------------------------------------------------

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File must be under 5MB");
      return;
    }

    setSelectedFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".jpg", ".jpeg", ".png"],
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    onDropRejected: (rejections) => {
      const reason = rejections[0]?.errors[0]?.code;
      if (reason === "file-too-large") {
        toast.error("File must be under 5MB");
      } else if (reason === "file-invalid-type") {
        toast.error("Only PDF, JPG, and PNG files are accepted");
      } else {
        toast.error("File rejected — please try again");
      }
    },
  });

  function removeFile() {
    setSelectedFile(null);
    setUploadProgress(0);
  }

  // -- Submit ----------------------------------------------------------------

  async function onSubmit(data: UploadCertFormData) {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) throw new Error("Authentication required");

      // Build storage path — landlord-documents is a private bucket
      const timestamp = Date.now();
      const ext = selectedFile.name.split(".").pop() ?? "pdf";
      const storagePath = `${user.id}/compliance/${data.property_id}/${data.category}/${timestamp}.${ext}`;

      // Upload to private landlord-documents bucket
      // Note: use XMLHttpRequest for progress tracking
      setUploadProgress(10);

      const { error: uploadError } = await supabase.storage
        .from("landlord-documents")
        .upload(storagePath, selectedFile, {
          contentType: selectedFile.type || "application/pdf",
          upsert: false,
        });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      setUploadProgress(70);

      // Calculate next_reminder_date (expiry - 30 days)
      const expiryDate = new Date(data.expiry_date);
      const reminderDate = new Date(expiryDate);
      reminderDate.setDate(reminderDate.getDate() - 30);

      // Insert document record via API route
      const response = await fetch("/api/landlord/compliance/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: data.property_id,
          category: data.category,
          document_name: data.document_name,
          expiry_date: data.expiry_date,
          storage_path: storagePath,
          next_reminder_date: reminderDate.toISOString().split("T")[0],
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error ?? "Failed to save document record");
      }

      setUploadProgress(100);
      toast.success("Certificate uploaded successfully");

      // Redirect back to compliance dashboard
      router.push("/dashboard/landlord/compliance");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Property selection */}
      <div className="space-y-1.5">
        <Label htmlFor="property_id">Property *</Label>
        <select
          id="property_id"
          {...register("property_id")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Select a property...</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.address}
            </option>
          ))}
        </select>
        {errors.property_id && (
          <p className="text-xs text-destructive">{errors.property_id.message}</p>
        )}
      </div>

      {/* Category selection */}
      <div className="space-y-1.5">
        <Label htmlFor="category">Certificate Type *</Label>
        <select
          id="category"
          {...register("category")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-xs text-destructive">{errors.category.message}</p>
        )}

        {/* UK compliance hint */}
        {hint && (
          <div className="flex items-start gap-2 rounded-md bg-muted p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <span>{hint.text}</span>
          </div>
        )}
      </div>

      {/* Document name */}
      <div className="space-y-1.5">
        <Label htmlFor="document_name">Document Name *</Label>
        <input
          id="document_name"
          type="text"
          {...register("document_name")}
          placeholder="e.g. Gas Safety Certificate 2026"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {errors.document_name && (
          <p className="text-xs text-destructive">{errors.document_name.message}</p>
        )}
      </div>

      {/* Expiry date */}
      <div className="space-y-1.5">
        <Label htmlFor="expiry_date">Expiry Date *</Label>
        <input
          id="expiry_date"
          type="date"
          {...register("expiry_date")}
          min={new Date().toISOString().split("T")[0]}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {errors.expiry_date && (
          <p className="text-xs text-destructive">{errors.expiry_date.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          A reminder will be sent 30 days before expiry.
        </p>
      </div>

      {/* File upload dropzone */}
      <div className="space-y-1.5">
        <Label>Certificate File * (PDF, JPG, PNG — max 5MB)</Label>

        {!selectedFile ? (
          <div
            {...getRootProps()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="size-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">
                {isDragActive ? "Drop file here" : "Drag & drop or click to upload"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                PDF, JPG, PNG — max 5MB
              </p>
            </div>
          </div>
        ) : (
          <Card className="border-success">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-success/10">
                  <FileText className="size-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="rounded-full p-1 hover:bg-muted"
                title="Remove file"
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload progress */}
      {isUploading && uploadProgress > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isUploading || !selectedFile}>
          {isUploading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 size-4" />
              Upload Certificate
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isUploading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
