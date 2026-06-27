import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeText } from "@/lib/validation/sanitize-text";

const TEXT_ONLY_REGEX = /^[a-zA-Z\s\-']+$/;
const UK_PHONE_REGEX = /^(\+44|0)[1-9]\d{8,9}$/;
const UK_POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, phone, postcode, bio, avatar_url")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { first_name, last_name, bio, phone, postcode } = body as {
    first_name?: unknown;
    last_name?: unknown;
    bio?: unknown;
    phone?: unknown;
    postcode?: unknown;
  };

  // Validate first_name
  if (first_name === undefined || first_name === null || first_name === "") {
    return NextResponse.json({ error: "first_name is required" }, { status: 400 });
  }
  if (typeof first_name !== "string") {
    return NextResponse.json({ error: "first_name must be a string" }, { status: 400 });
  }
  if (first_name.length > 100) {
    return NextResponse.json({ error: "first_name must be 100 characters or fewer" }, { status: 400 });
  }
  if (!TEXT_ONLY_REGEX.test(first_name)) {
    return NextResponse.json({ error: "first_name must contain only letters, spaces, hyphens, or apostrophes" }, { status: 400 });
  }

  // Validate last_name
  if (last_name === undefined || last_name === null || last_name === "") {
    return NextResponse.json({ error: "last_name is required" }, { status: 400 });
  }
  if (typeof last_name !== "string") {
    return NextResponse.json({ error: "last_name must be a string" }, { status: 400 });
  }
  if (last_name.length > 100) {
    return NextResponse.json({ error: "last_name must be 100 characters or fewer" }, { status: 400 });
  }
  if (!TEXT_ONLY_REGEX.test(last_name)) {
    return NextResponse.json({ error: "last_name must contain only letters, spaces, hyphens, or apostrophes" }, { status: 400 });
  }

  // Validate bio (optional)
  if (bio !== undefined && bio !== null) {
    if (typeof bio !== "string") {
      return NextResponse.json({ error: "bio must be a string" }, { status: 400 });
    }
    if (bio.length > 300) {
      return NextResponse.json({ error: "bio must be 300 characters or fewer" }, { status: 400 });
    }
  }

  // Validate phone (optional)
  if (phone !== undefined && phone !== null && phone !== "") {
    if (typeof phone !== "string") {
      return NextResponse.json({ error: "phone must be a string" }, { status: 400 });
    }
    const normalizedPhone = (phone as string).replace(/\s/g, "");
    if (!UK_PHONE_REGEX.test(normalizedPhone)) {
      return NextResponse.json({ error: "phone must be a valid UK phone number" }, { status: 400 });
    }
    // Reassign to normalised value so updates object stores the clean version
    (body as Record<string, unknown>).phone = normalizedPhone;
  }

  // Validate postcode (optional)
  if (postcode !== undefined && postcode !== null && postcode !== "") {
    if (typeof postcode !== "string") {
      return NextResponse.json({ error: "postcode must be a string" }, { status: 400 });
    }
    if (!UK_POSTCODE_REGEX.test(postcode)) {
      return NextResponse.json({ error: "postcode must be a valid UK postcode" }, { status: 400 });
    }
  }

  // Only update allowed fields — never spread req body directly
  const updates: Record<string, string | null> = {
    first_name: first_name as string,
    last_name: last_name as string,
  };

  if (bio !== undefined) {
    updates.bio = bio !== null ? sanitizeText(bio as string) : null;
  }
  if (phone !== undefined) {
    // Use normalised phone (spaces stripped) stored back to body above
    updates.phone = (body.phone as string | null) ?? null;
  }
  if (postcode !== undefined) {
    updates.postcode = (postcode as string | null) ?? null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("id, first_name, last_name, phone, postcode, bio, avatar_url")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json(data);
}
