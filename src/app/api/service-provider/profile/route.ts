import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile, updateProviderProfile } from "@/services/profile/profile-service";
import { ZodError } from "zod";

export async function GET() {
  try {
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

    const profile = await getProfile(supabase, user.id);

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 },
      );
    }

    if (profile.active_role !== "service_provider") {
      return NextResponse.json(
        { error: "Only service providers can access this resource" },
        { status: 403 },
      );
    }

    // Return provider-specific details from the profile
    const providerDetails = (profile as unknown as Record<string, unknown>).provider_details ?? null;

    return NextResponse.json({ data: providerDetails });
  } catch (error) {
    console.error("[GET /api/service-provider/profile]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
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
    await updateProviderProfile(supabase, user.id, body);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("Only service providers")) {
      return NextResponse.json(
        { error: message },
        { status: 403 },
      );
    }

    console.error("[PUT /api/service-provider/profile]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
