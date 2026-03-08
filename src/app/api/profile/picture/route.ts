import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadAvatar } from "@/services/profile/profile-service";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
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

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided. Send a 'file' field in FormData." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 },
      );
    }

    const buffer = await file.arrayBuffer();
    const publicUrl = await uploadAvatar(supabase, user.id, buffer);

    return NextResponse.json({ data: { avatar_url: publicUrl } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("Invalid file type")) {
      return NextResponse.json(
        { error: message },
        { status: 400 },
      );
    }

    console.error("[POST /api/profile/picture]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
