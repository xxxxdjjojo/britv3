/**
 * provider-certificate-service.ts
 *
 * Issuance and retrieval of job completion certificates (Gas Safe CP12,
 * EIC, EICR, Minor Works, Custom). All functions accept a SupabaseClient
 * so they work in both server and client contexts.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CertificateType =
  | "gas_safe_cp12"
  | "eic"
  | "eicr"
  | "minor_works"
  | "custom";

export type Certificate = Readonly<{
  id: string;
  bookingId: string | null;
  providerId: string;
  certificateType: CertificateType;
  certificateNumber: string | null;
  data: Record<string, unknown>;
  issuedAt: string;
  expiresAt: string | null;
  filePath: string | null;
  notes: string | null;
  createdAt: string;
}>;

export type CertificateInput = Readonly<{
  bookingId?: string;
  certificateType: CertificateType;
  certificateNumber?: string;
  data?: Record<string, unknown>;
  issuedAt?: string;
  expiresAt?: string;
  notes?: string;
}>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_CERTIFICATE_TYPES: readonly CertificateType[] = [
  "gas_safe_cp12",
  "eic",
  "eicr",
  "minor_works",
  "custom",
];

/** Gas Safe CP12 certificate numbers are exactly 6 numeric digits. */
const GAS_SAFE_NUMBER_RE = /^\d{6}$/;

// ---------------------------------------------------------------------------
// Row → Certificate mapper
// ---------------------------------------------------------------------------

type CertificateRow = {
  id: string;
  booking_id: string | null;
  provider_id: string;
  certificate_type: string;
  certificate_number: string | null;
  data: Record<string, unknown> | null;
  issued_at: string;
  expires_at: string | null;
  file_path: string | null;
  notes: string | null;
  created_at: string;
};

function mapRow(row: CertificateRow): Certificate {
  return {
    id: row.id,
    bookingId: row.booking_id,
    providerId: row.provider_id,
    certificateType: row.certificate_type as CertificateType,
    certificateNumber: row.certificate_number,
    data: row.data ?? {},
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    filePath: row.file_path,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// issueCertificate
// ---------------------------------------------------------------------------

/**
 * Validates and inserts a new certificate for a provider.
 * - Validates certificateType is one of the allowed values.
 * - For gas_safe_cp12: validates certificateNumber is 6-digit numeric (if provided).
 */
export async function issueCertificate(
  supabase: SupabaseClient,
  providerId: string,
  input: CertificateInput,
): Promise<Certificate> {
  // Validate certificate type
  if (!VALID_CERTIFICATE_TYPES.includes(input.certificateType)) {
    throw new Error(
      `Invalid certificate type: "${input.certificateType}". Must be one of: ${VALID_CERTIFICATE_TYPES.join(", ")}`,
    );
  }

  // Gas Safe: validate number format if provided
  if (
    input.certificateType === "gas_safe_cp12" &&
    input.certificateNumber !== undefined &&
    input.certificateNumber !== null
  ) {
    if (!GAS_SAFE_NUMBER_RE.test(input.certificateNumber)) {
      throw new Error(
        "Gas Safe certificate number must be exactly 6 numeric digits (e.g. 123456).",
      );
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("certificates")
    .insert({
      provider_id: providerId,
      booking_id: input.bookingId ?? null,
      certificate_type: input.certificateType,
      certificate_number: input.certificateNumber ?? null,
      data: input.data ?? {},
      issued_at: input.issuedAt ?? today,
      expires_at: input.expiresAt ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to issue certificate: ${error.message}`);

  return mapRow(data as CertificateRow);
}

// ---------------------------------------------------------------------------
// getCertificatesByBooking
// ---------------------------------------------------------------------------

/**
 * Returns all certificates for a specific booking, filtered by providerId.
 * Ordered by created_at DESC.
 */
export async function getCertificatesByBooking(
  supabase: SupabaseClient,
  bookingId: string,
  providerId: string,
): Promise<Certificate[]> {
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("booking_id", bookingId)
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch certificates for booking: ${error.message}`);
  return (data ?? []).map((row) => mapRow(row as CertificateRow));
}

// ---------------------------------------------------------------------------
// getCertificatesByProvider
// ---------------------------------------------------------------------------

/**
 * Returns all certificates issued by a provider, ordered by created_at DESC.
 */
export async function getCertificatesByProvider(
  supabase: SupabaseClient,
  providerId: string,
): Promise<Certificate[]> {
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch certificates for provider: ${error.message}`);
  return (data ?? []).map((row) => mapRow(row as CertificateRow));
}

// ---------------------------------------------------------------------------
// uploadCertificateFile
// ---------------------------------------------------------------------------

/**
 * Validates the certificate exists and belongs to the provider, uploads a
 * file to the "certificates" Storage bucket at
 * `{providerId}/{certId}/{filename}`, then updates the certificate record
 * with the storage path.
 *
 * Returns the storage path on success.
 */
export async function uploadCertificateFile(
  supabase: SupabaseClient,
  certId: string,
  providerId: string,
  filePath: string,
  fileBuffer: ArrayBuffer | Blob,
): Promise<string> {
  // Verify the certificate exists and belongs to this provider
  const { data: existing, error: fetchError } = await supabase
    .from("certificates")
    .select("id")
    .eq("id", certId)
    .eq("provider_id", providerId)
    .maybeSingle();

  if (fetchError) throw new Error(`Failed to verify certificate: ${fetchError.message}`);
  if (!existing) throw new Error("Certificate not found or access denied.");

  const filename = filePath.split("/").pop() ?? filePath;
  const storagePath = `${providerId}/${certId}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from("certificates")
    .upload(storagePath, fileBuffer, { upsert: true });

  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  const { error: updateError } = await supabase
    .from("certificates")
    .update({ file_path: storagePath })
    .eq("id", certId)
    .eq("provider_id", providerId);

  if (updateError) throw new Error(`Failed to update certificate file path: ${updateError.message}`);

  return storagePath;
}
