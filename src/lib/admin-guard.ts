import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export type AdminContext = {
  user: User;
  supabase: SupabaseClient;
};

export async function adminOnly(
  _request: Request,
): Promise<AdminContext | Response> {
  let supabase: SupabaseClient;

  try {
    supabase = await createClient();
  } catch (e) {
    console.error("[admin-guard] Failed to create Supabase client:", e);
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let profile: { role: string | null } | null = null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("[admin-guard] Failed to fetch profile:", error);
      return Response.json({ error: "Service unavailable" }, { status: 503 });
    }

    profile = data as { role: string | null } | null;
  } catch (e) {
    console.error("[admin-guard] DB error fetching profile:", e);
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  if (profile?.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return { user, supabase };
}
