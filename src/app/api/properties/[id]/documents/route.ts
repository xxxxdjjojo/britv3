import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getDocuments,
  createDocument,
} from "@/services/landlord/document-service";
import { documentUploadSchema } from "@/types/landlord";
import type { DocumentCategory } from "@/types/landlord";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: propertyId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as DocumentCategory | null;

    const documents = await getDocuments(
      supabase,
      propertyId,
      category ? { category } : undefined,
    );

    return NextResponse.json({ data: documents });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch documents";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: propertyId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();

    // Validate metadata
    const parsed = documentUploadSchema.parse(body);

    const document = await createDocument(supabase, propertyId, {
      name: parsed.name,
      category: parsed.category,
      expiry_date: parsed.expiry_date || undefined,
      file_url: body.file_url,
      file_size: body.file_size,
      uploaded_by: user.id,
      tenancy_id: body.tenancy_id ?? null,
    });

    return NextResponse.json({ data: document }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create document";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
