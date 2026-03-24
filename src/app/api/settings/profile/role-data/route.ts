import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeText } from "@/lib/validation/sanitize";

const AGENT_FIELDS = new Set(["agency_name", "specializations", "coverage_areas"]);
const PROVIDER_FIELDS = new Set(["business_name", "trading_name", "service_postcodes"]);

const MAX_TEXT_LENGTH = 200;
const MAX_ARRAY_ITEMS = 20;
const MAX_ARRAY_ITEM_LENGTH = 100;

function sanitizeStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is string => typeof item === "string")
    .slice(0, MAX_ARRAY_ITEMS)
    .map((s) => sanitizeText(s.trim()).slice(0, MAX_ARRAY_ITEM_LENGTH))
    .filter(Boolean);
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

  const { role, data } = body as { role?: unknown; data?: unknown };

  if (typeof role !== "string" || (role !== "agent" && role !== "service_provider")) {
    return NextResponse.json(
      { error: "role must be 'agent' or 'service_provider'" },
      { status: 400 }
    );
  }

  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return NextResponse.json({ error: "data must be an object" }, { status: 400 });
  }

  // Verify user actually has this role
  const { data: profile } = await supabase
    .from("profiles")
    .select("active_role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.active_role !== role) {
    return NextResponse.json(
      { error: "Role mismatch — you cannot update data for a role you do not hold" },
      { status: 403 }
    );
  }

  const rawData = data as Record<string, unknown>;

  if (role === "agent") {
    // Whitelist fields
    const updates: Record<string, unknown> = {};
    for (const key of Object.keys(rawData)) {
      if (!AGENT_FIELDS.has(key)) continue;

      if (key === "agency_name") {
        const val = rawData[key];
        if (typeof val !== "string") continue;
        updates.agency_name = sanitizeText(val.trim()).slice(0, MAX_TEXT_LENGTH);
      } else if (key === "specializations") {
        updates.specializations = sanitizeStringArray(rawData[key]);
      } else if (key === "coverage_areas") {
        updates.coverage_areas = sanitizeStringArray(rawData[key]);
      }
    }

    const { error } = await supabase
      .from("agent_agency_profiles")
      .upsert(
        { agent_id: user.id, ...updates },
        { onConflict: "agent_id" }
      );

    if (error) {
      return NextResponse.json({ error: "Failed to save agency details" }, { status: 500 });
    }
  } else {
    // service_provider
    const updates: Record<string, unknown> = {};
    for (const key of Object.keys(rawData)) {
      if (!PROVIDER_FIELDS.has(key)) continue;

      if (key === "business_name") {
        const val = rawData[key];
        if (typeof val !== "string") continue;
        updates.business_name = sanitizeText(val.trim()).slice(0, MAX_TEXT_LENGTH);
      } else if (key === "trading_name") {
        const val = rawData[key];
        if (val === null) {
          updates.trading_name = null;
        } else if (typeof val === "string") {
          updates.trading_name = sanitizeText(val.trim()).slice(0, MAX_TEXT_LENGTH) || null;
        }
      } else if (key === "service_postcodes") {
        updates.service_postcodes = sanitizeStringArray(rawData[key]);
      }
    }

    const { error } = await supabase
      .from("service_provider_details")
      .upsert(
        { user_id: user.id, ...updates },
        { onConflict: "user_id" }
      );

    if (error) {
      return NextResponse.json({ error: "Failed to save business details" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
