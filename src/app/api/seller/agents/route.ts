import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AgentProfile } from "@/types/seller";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const area = searchParams.get("area");
  const ids = searchParams.get("ids");

  let profiles;

  if (ids) {
    const idList = ids.split(",").filter(Boolean).slice(0, 3);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, metadata")
      .in("id", idList);
    if (error) return NextResponse.json({ error: String(error) }, { status: 500 });
    profiles = data;
  } else {
    // Fetch agent user IDs first (Supabase TS doesn't support subqueries in .in())
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "agent")
      .limit(50);
    const agentIds = (roleData ?? []).map((r) => r.user_id as string);
    if (agentIds.length === 0) return NextResponse.json([]);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, metadata")
      .in("id", agentIds)
      .limit(20);
    if (error) return NextResponse.json({ error: String(error) }, { status: 500 });
    profiles = data;
  }

  const agents: AgentProfile[] = (profiles ?? []).map((p) => {
    const meta = (p.metadata ?? {}) as Record<string, unknown>;
    return {
      id: p.id,
      full_name: p.full_name ?? "Estate Agent",
      agency_name: (meta.agency_name as string | undefined) ?? "Independent Agent",
      avatar_url: p.avatar_url,
      areas_covered: (meta.areas_covered as string[] | undefined) ?? [],
      fee_percentage: (meta.fee_percentage as number | undefined) ?? null,
      average_rating: (meta.average_rating as number | undefined) ?? null,
      review_count: (meta.review_count as number | undefined) ?? 0,
      sold_count: (meta.sold_count as number | undefined) ?? 0,
      average_days_to_sell: (meta.average_days_to_sell as number | undefined) ?? null,
      bio: (meta.bio as string | undefined) ?? null,
    };
  });

  const filtered = area
    ? agents.filter((a) =>
        a.areas_covered.some((ac) => ac.toLowerCase().includes(area.toLowerCase())),
      )
    : agents;

  return NextResponse.json(filtered);
}
