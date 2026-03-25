import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyReferenceToken } from "@/lib/auth/reference-token";
import { createAdminClient } from "@/lib/supabase/admin";

const submitSchema = z.object({
  token: z.string().min(1),
  reference_text: z.string().min(50).max(2000),
  rating: z.number().int().min(1).max(5),
  gdpr_consent: z.literal(true),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Parse + validate body
    const body = await request.json().catch(() => null);
    const parsed = submitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid submission. Please check all fields and try again." },
        { status: 400 },
      );
    }

    const { token, reference_text, rating } = parsed.data;

    // 2. Verify HMAC token
    const result = verifyReferenceToken(token);
    if (!result.valid) {
      return NextResponse.json(
        { error: "This reference link has expired or is invalid. Please ask the provider to send a new request." },
        { status: 401 },
      );
    }

    // 3. Fetch reference row and check status
    const supabase = createAdminClient();
    const { data: reference, error: fetchError } = await supabase
      .from("provider_references")
      .select("id, status")
      .eq("id", result.referenceId)
      .single();

    if (fetchError || !reference) {
      return NextResponse.json(
        { error: "Reference request not found." },
        { status: 404 },
      );
    }

    if (reference.status !== "pending") {
      return NextResponse.json(
        { error: "This reference has already been submitted." },
        { status: 409 },
      );
    }

    // 4. Update reference — append rating to text since table has no rating column
    const fullText = `${reference_text}\n\n---\nRating: ${rating}/5`;

    const { error: updateError } = await supabase
      .from("provider_references")
      .update({
        status: "submitted",
        reference_text: fullText,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", result.referenceId);

    if (updateError) {
      console.error("Failed to update reference:", updateError);
      return NextResponse.json(
        { error: "Failed to save reference. Please try again." },
        { status: 500 },
      );
    }

    // 5. Fire Inngest event (best-effort)
    try {
      const { inngest } = await import("@/inngest/client");
      await inngest.send({
        name: "provider/reference.submitted",
        data: {
          referenceId: result.referenceId,
          providerId: result.providerId,
        },
      });
    } catch {
      // Best-effort — submission already saved
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reference submission error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
