import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteDocument, isServiceError } from "@/services/documents/documents-service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: documentId } = await params;
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

    const result = await deleteDocument(supabase, user.id, documentId);

    if (isServiceError(result)) {
      if (result.error === "NOT_FOUND") {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
