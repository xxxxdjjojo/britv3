import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "./require-auth";

type AgentSuccess = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
  response?: never;
};

type AgentFailure = {
  supabase?: never;
  user?: never;
  response: NextResponse;
};

export async function requireAgent(): Promise<AgentSuccess | AgentFailure> {
  const auth = await requireAuth();
  if (auth.response) {
    return auth;
  }

  const { data: profile, error } = await auth.supabase
    .from("profiles")
    .select("active_role")
    .eq("id", auth.user.id)
    .single();

  if (error || profile?.active_role !== "agent") {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { supabase: auth.supabase, user: auth.user };
}
