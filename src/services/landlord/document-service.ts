/**
 * Document service -- CRUD operations for property documents,
 * storage management, and compliance expiry tracking.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PropertyDocument, DocumentCategory, ComplianceDocument } from "@/types/landlord";
import { documentUploadSchema } from "@/types/landlord";
import { validateFileType, MAX_FILE_SIZES } from "@/lib/file-validation";

// -- Filters type -------------------------------------------------------------

type DocumentFilters = Readonly<{
  category?: DocumentCategory;
}>;

// -- Expiry status helper -----------------------------------------------------

export type ExpiryStatus = "valid" | "expiring" | "expired" | "none";

/**
 * Compute expiry status from an expiry_date string.
 * green = valid (>30 days), amber = expiring (<=30 days), red = expired, none = no date.
 */
export function getExpiryStatus(expiryDate: string | null): ExpiryStatus {
  if (!expiryDate) return "none";

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "expired";
  if (diffDays <= 30) return "expiring";
  return "valid";
}

// -- Service functions --------------------------------------------------------

/**
 * List documents for a property, with optional category filter.
 * Ordered by created_at DESC (newest first).
 */
export async function getDocuments(
  supabase: SupabaseClient,
  propertyId: string,
  filters?: DocumentFilters,
): Promise<PropertyDocument[]> {
  let query = supabase
    .from("property_documents")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }

  return (data ?? []) as PropertyDocument[];
}

/**
 * Create a document record.
 * Validates metadata with Zod schema. File upload to Storage should be done
 * client-side before calling this, passing the resulting file_url.
 */
export async function createDocument(
  supabase: SupabaseClient,
  propertyId: string,
  metadata: {
    name: string;
    category: DocumentCategory;
    expiry_date?: string;
    file_url: string;
    file_size?: number;
    uploaded_by: string;
    tenancy_id?: string | null;
  },
): Promise<PropertyDocument> {
  // Validate metadata fields
  documentUploadSchema.parse({
    name: metadata.name,
    category: metadata.category,
    expiry_date: metadata.expiry_date ?? "",
  });

  const { data, error } = await supabase
    .from("property_documents")
    .insert({
      property_id: propertyId,
      name: metadata.name,
      category: metadata.category,
      expiry_date: metadata.expiry_date || null,
      file_url: metadata.file_url,
      file_size: metadata.file_size ?? null,
      uploaded_by: metadata.uploaded_by,
      tenancy_id: metadata.tenancy_id ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to create document: ${error?.message ?? "no data"}`,
    );
  }

  return data as PropertyDocument;
}

/**
 * Delete a document record and its file from Supabase Storage.
 * Fetches the record first to get the file_url for storage deletion.
 */
export async function deleteDocument(
  supabase: SupabaseClient,
  documentId: string,
): Promise<void> {
  // Fetch document to get file_url
  const { data: doc, error: fetchError } = await supabase
    .from("property_documents")
    .select("*")
    .eq("id", documentId)
    .single();

  if (fetchError || !doc) {
    throw new Error(
      `Document not found: ${fetchError?.message ?? "no data"}`,
    );
  }

  // Extract storage path from file_url
  const fileUrl = (doc as PropertyDocument).file_url;
  if (fileUrl) {
    // Parse the storage path from the URL
    // URL format: .../storage/v1/object/public/property-documents/{path}
    const storagePathMatch = fileUrl.match(
      /\/storage\/v1\/object\/public\/property-documents\/(.+)$/,
    );
    if (storagePathMatch) {
      await supabase.storage
        .from("property-documents")
        .remove([storagePathMatch[1]]);
    }
  }

  // Delete database record
  const { error: deleteError } = await supabase
    .from("property_documents")
    .delete()
    .eq("id", documentId);

  if (deleteError) {
    throw new Error(`Failed to delete document: ${deleteError.message}`);
  }
}

/**
 * Get documents that are expiring within 30 days or already expired.
 * Used by ComplianceAlert component.
 */
export async function getExpiringDocuments(
  supabase: SupabaseClient,
  propertyId: string,
): Promise<PropertyDocument[]> {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const { data, error } = await supabase
    .from("property_documents")
    .select("*")
    .eq("property_id", propertyId)
    .not("expiry_date", "is", null)
    .lte("expiry_date", thirtyDaysFromNow.toISOString().split("T")[0])
    .order("expiry_date", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch expiring documents: ${error.message}`);
  }

  return (data ?? []) as PropertyDocument[];
}

// -- Phase 14 additions -------------------------------------------------------

const COMPLIANCE_CATEGORIES = ["gas_safety", "electrical_eicr", "epc"] as const;

/**
 * Fetch all compliance documents for the landlord's portfolio, computing status.
 * Queries property_documents for gas_safety, electrical_eicr, epc categories.
 * Status: expired (expiry_date < today), expiring_soon (< today+30d), valid.
 */
export async function getComplianceSummary(
  supabase: SupabaseClient,
): Promise<ComplianceDocument[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase
    .from("property_documents")
    .select(`
      id,
      category,
      expiry_date,
      property:listings!inner(address_line_1, city, postcode)
    `)
    .in("category", COMPLIANCE_CATEGORIES)
    .not("expiry_date", "is", null)
    .order("expiry_date", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch compliance summary: ${error.message}`);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

  return (data ?? []).map((doc) => {
    const expiryDate = new Date(doc.expiry_date as string);
    expiryDate.setHours(0, 0, 0, 0);

    let status: ComplianceDocument["status"];
    if (expiryDate < today) {
      status = "expired";
    } else if (expiryDate <= thirtyDaysLater) {
      status = "expiring_soon";
    } else {
      status = "valid";
    }

    const rawProperty = doc.property as unknown;
    const property =
      rawProperty !== null &&
      typeof rawProperty === "object" &&
      "address_line_1" in rawProperty
        ? (rawProperty as { address_line_1: string; city: string; postcode: string })
        : { address_line_1: "", city: "", postcode: "" };

    return {
      id: doc.id as string,
      category: doc.category as string,
      expiry_date: doc.expiry_date as string,
      status,
      property: {
        address_line_1: property.address_line_1 ?? "",
        city: property.city ?? "",
        postcode: property.postcode ?? "",
      },
    };
  });
}

/**
 * Upload a document file to Supabase Storage.
 * Validates file type via magic bytes and checks size limit.
 * Returns the public URL of the uploaded file.
 */
export async function uploadDocumentFile(
  supabase: SupabaseClient,
  propertyId: string,
  documentId: string,
  file: File,
): Promise<string> {
  // Validate file type
  const validation = await validateFileType(file);
  if (!validation.valid) {
    throw new Error("Only PDF, JPG, and PNG files are allowed");
  }

  // Check file size (2MB max for property-documents)
  if (file.size > MAX_FILE_SIZES["property-documents"]) {
    throw new Error("File size must not exceed 2MB");
  }

  // Upload to storage
  const filePath = `${propertyId}/${documentId}/${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("property-documents")
    .upload(filePath, file, {
      contentType: validation.mimeType!,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("property-documents").getPublicUrl(filePath);

  return publicUrl;
}
