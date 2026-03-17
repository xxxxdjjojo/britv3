import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getDocuments,
  uploadDocument,
  isServiceError,
} from "@/services/documents/documents-service";
import type { DocumentType } from "@/services/documents/documents-service";

const VALID_DOCUMENT_TYPES: DocumentType[] = [
  "id_proof",
  "proof_of_funds",
  "aip_letter",
  "other",
];

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

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

    const result = await getDocuments(supabase, user.id);

    if (isServiceError(result)) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
    }

    const file = formData.get("file");
    const documentType = formData.get("documentType");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (!documentType || typeof documentType !== "string") {
      return NextResponse.json({ error: "documentType is required" }, { status: 400 });
    }

    if (!VALID_DOCUMENT_TYPES.includes(documentType as DocumentType)) {
      return NextResponse.json(
        { error: `documentType must be one of: ${VALID_DOCUMENT_TYPES.join(", ")}` },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds 50 MB limit" },
        { status: 413 },
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Use PDF, JPG, PNG, WEBP, DOC, or DOCX" },
        { status: 415 },
      );
    }

    const result = await uploadDocument(supabase, user.id, file, documentType as DocumentType);

    if (isServiceError(result)) {
      if (result.error === "FILE_TOO_LARGE") {
        return NextResponse.json({ error: "File size exceeds 50 MB limit" }, { status: 413 });
      }
      if (result.error === "INVALID_MIME_TYPE") {
        return NextResponse.json({ error: "File type not allowed" }, { status: 415 });
      }
      // TODO: posthog.capture("document.upload_failed", { error: result.error })
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // TODO: posthog.capture("document.uploaded", { documentId: result.document.id })

    return NextResponse.json(result.document, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
