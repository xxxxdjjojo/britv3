import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// -- Request schema ----------------------------------------------------------

const uploadBodySchema = z.object({
  property_id: z.string().uuid("Invalid property ID"),
  category: z.enum([
    "gas_safety",
    "electrical_eicr",
    "epc",
    "insurance",
    "lease_agreement",
    "inventory",
  ]),
  document_name: z.string().min(3, "Document name required"),
  expiry_date: z.string().min(1, "Expiry date required"),
  storage_path: z.string().min(1, "Storage path required"),
  next_reminder_date: z.string().optional(),
});

// -- POST /api/landlord/compliance/upload ------------------------------------

export async function POST(request: Request) {
  const supabase = await createClient();

  // Auth check — server-side defense in depth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = uploadBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 },
    );
  }

  const {
    property_id,
    category,
    document_name,
    expiry_date,
    storage_path,
    next_reminder_date,
  } = parsed.data;

  // Verify the property belongs to this landlord
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id")
    .eq("id", property_id)
    .eq("user_id", user.id)
    .single();

  if (listingError || !listing) {
    return NextResponse.json(
      { error: "Property not found or access denied" },
      { status: 403 },
    );
  }

  // Prevent path traversal: storage_path must be scoped to this property
  if (storage_path.includes("..") || !storage_path.startsWith(`${property_id}/`)) {
    return NextResponse.json(
      { error: "Invalid storage path" },
      { status: 400 },
    );
  }

  // Create signed URL for internal reference (never expose public URL)
  // The storage_path is stored as the document_url reference
  // Consumers fetch a signed URL on demand via createSignedUrl
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from("landlord-documents")
    .createSignedUrl(storage_path, 60 * 60); // 1 hour signed URL

  if (signedUrlError) {
    return NextResponse.json(
      { error: `Failed to create signed URL: ${signedUrlError.message}` },
      { status: 500 },
    );
  }

  // Insert document record
  // document_url stores the storage path (not the signed URL which is ephemeral)
  const { data: document, error: insertError } = await supabase
    .from("property_documents")
    .insert({
      property_id,
      uploaded_by: user.id,
      name: document_name,
      category,
      file_url: storage_path, // store path, not public URL
      expiry_date,
      next_reminder_date: next_reminder_date ?? null,
      reminder_sent: false,
    })
    .select()
    .single();

  if (insertError || !document) {
    return NextResponse.json(
      { error: `Failed to create document record: ${insertError?.message ?? "no data"}` },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      document_id: document.id,
      document_url: signedUrlData.signedUrl,
      storage_path,
    },
    { status: 201 },
  );
}
