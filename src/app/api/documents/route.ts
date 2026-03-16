/**
 * API routes for buyer document vault.
 * GET  /api/documents       — list user's documents
 * POST /api/documents       — upload document (multipart/form-data)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDocuments, uploadDocument } from "@/services/documents/documents-service";
import type { DocumentType } from "@/services/documents/documents-service";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const VALID_DOCUMENT_TYPES: DocumentType[] = [
  "id_proof",
  "proof_of_funds",
  "aip_letter",
  "other",
];

/**
 * GET /api/documents — return the authenticated user's documents
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documents = await getDocuments(supabase, user.id);
    return NextResponse.json(documents);
  } catch (error) {
    console.error("[documents] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/documents — upload a document
 * Expects multipart/form-data with fields: file, document_type, offer_id? (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const documentType = formData.get("document_type") as string | null;
    const offerId = formData.get("offer_id") as string | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!documentType || !VALID_DOCUMENT_TYPES.includes(documentType as DocumentType)) {
      return NextResponse.json(
        { error: "Invalid or missing document_type" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 50MB)" },
        { status: 413 },
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 415 },
      );
    }

    const document = await uploadDocument(
      supabase,
      user.id,
      file,
      documentType as DocumentType,
      offerId ?? undefined,
    );

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("[documents] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
