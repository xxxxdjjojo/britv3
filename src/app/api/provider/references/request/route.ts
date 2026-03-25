import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendReferenceRequest } from "@/services/provider/provider-verification-service";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get provider_id from service_provider_details
  const { data: provider } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { referee_name, referee_email, reference_type } = body as {
    referee_name: string;
    referee_email: string;
    reference_type: "client" | "peer";
  };

  if (!referee_name || !referee_email) {
    return NextResponse.json({ error: "referee_name and referee_email are required" }, { status: 400 });
  }

  const validTypes = ["client", "peer"] as const;
  const safeType = validTypes.includes(reference_type) ? reference_type : "client";

  const result = await sendReferenceRequest(
    provider.id,
    { referee_name, referee_email, reference_type: safeType },
    supabase,
  );

  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, referenceRequestId: result.referenceRequestId });
}
