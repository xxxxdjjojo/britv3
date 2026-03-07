import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteDocument } from "@/services/landlord/document-service";

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

    await deleteDocument(supabase, documentId);

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete document";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
