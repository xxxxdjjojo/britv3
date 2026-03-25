import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "buyer-documents";
const SIGNED_URL_EXPIRY_SECONDS = 3600; // 1 hour

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  try {
    const { documentId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch document ensuring it belongs to the authenticated user
    const { data: doc, error: fetchError } = await supabase
      .from("user_documents")
      .select("storage_path")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const { data: signedUrlData, error: storageError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.storage_path, SIGNED_URL_EXPIRY_SECONDS);

    if (storageError || !signedUrlData?.signedUrl) {
      return NextResponse.json(
        { error: "Failed to generate download URL" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: signedUrlData.signedUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
