import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_AVATAR_SIZE = 819200; // 800KB in bytes

function detectImageType(buffer: Uint8Array): "jpeg" | "png" | null {
  if (buffer.length < 4) return null;

  // JPEG: starts with FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }

  // PNG: starts with 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }

  return null;
}

function extractStoragePath(avatarUrl: string): string | null {
  try {
    const url = new URL(avatarUrl);
    // Supabase public URLs: /storage/v1/object/public/avatars/{path}
    const match = url.pathname.match(/\/storage\/v1\/object\/public\/avatars\/(.+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const avatarFile = formData.get("avatar");

  if (!avatarFile || !(avatarFile instanceof File)) {
    return NextResponse.json({ error: "No avatar file provided" }, { status: 400 });
  }

  if (avatarFile.size > MAX_AVATAR_SIZE) {
    return NextResponse.json(
      { error: "File size must not exceed 800KB" },
      { status: 400 },
    );
  }

  // Read file bytes for magic byte validation
  const arrayBuffer = await avatarFile.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const imageType = detectImageType(buffer);
  if (!imageType) {
    return NextResponse.json(
      { error: "File must be a JPEG or PNG image" },
      { status: 415 },
    );
  }

  const extension = imageType === "jpeg" ? "jpeg" : "png";
  const storagePath = `${user.id}/avatar.${extension}`;

  // Get old avatar_url to delete from storage
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  if (profile?.avatar_url) {
    const oldPath = extractStoragePath(profile.avatar_url);
    if (oldPath) {
      // Best-effort delete — don't fail if old file doesn't exist
      await adminClient.storage.from("avatars").remove([oldPath]);
    }
  }

  // Upload new file using service role client
  const { error: uploadError } = await adminClient.storage
    .from("avatars")
    .upload(storagePath, buffer, {
      contentType: imageType === "jpeg" ? "image/jpeg" : "image/png",
      upsert: true,
    });

  if (uploadError) {
    // Old file was already deleted; null out the dangling reference so the profile
    // doesn't hold a broken avatar_url pointing to the now-deleted storage object.
    await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", user.id);

    return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = adminClient.storage
    .from("avatars")
    .getPublicUrl(storagePath);

  const avatarUrl = urlData.publicUrl;

  // Update profiles table
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update profile avatar" }, { status: 500 });
  }

  return NextResponse.json({ avatar_url: avatarUrl });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();

  // Get current avatar_url
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  if (profile?.avatar_url) {
    const oldPath = extractStoragePath(profile.avatar_url);
    if (oldPath) {
      await adminClient.storage.from("avatars").remove([oldPath]);
    }
  }

  // Clear avatar_url in profiles
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to remove avatar" }, { status: 500 });
  }

  return NextResponse.json({ avatar_url: null });
}
