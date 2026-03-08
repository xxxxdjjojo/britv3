import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { documentUploadSchema } from "@/lib/validators/marketplace-schemas";
import { uploadProviderDocument } from "@/services/marketplace/provider-service";
import { MAX_FILE_SIZE } from "@/lib/marketplace/file-validator";

/**
 * POST /api/providers/documents/upload
 * Authenticated endpoint -- upload a verification document.
 * Accepts multipart form data with: file (required), document_type (required).
 *
 * Rate limit: max 10 uploads per hour (to be enforced via Upstash in later phase).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file");
    const documentType = formData.get("document_type");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    // Check file size before reading into buffer
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 413 }
      );
    }

    // Validate document_type
    const parseResult = documentUploadSchema.safeParse({
      document_type: documentType,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const doc = await uploadProviderDocument(
      supabase,
      user.id,
      buffer,
      parseResult.data.document_type,
      file.name
    );

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";

    // File validation errors should be 400
    if (message.includes("not allowed") || message.includes("Unable to determine")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
