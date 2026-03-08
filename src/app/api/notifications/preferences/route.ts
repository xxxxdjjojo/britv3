import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/services/profile/profile-service";
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

    const preferences = await getNotificationPreferences(supabase, user.id);

    return NextResponse.json({ data: preferences });
  } catch (error) {
    console.error("[GET /api/notifications/preferences]", error);
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
    const preferences = await updateNotificationPreferences(supabase, user.id, body);

    return NextResponse.json({ data: preferences });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    console.error("[PUT /api/notifications/preferences]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
