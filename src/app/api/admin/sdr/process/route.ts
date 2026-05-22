// src/app/api/admin/sdr/process/route.ts
//
// Memo Pivot v2 — cron-triggered batch processor for the SDR queue.

import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { processBatch } from "@/services/acquisition/sdr-campaign-service";

async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    return data?.role === "admin";
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const cronHeader = request.headers.get("x-cron-key");
  const cronOk =
    !!process.env.CRON_SECRET && cronHeader === process.env.CRON_SECRET;
  if (!cronOk && !(await isAdmin())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit")) || 50));
  const result = await processBatch({ limit, dryRun: false });
  return NextResponse.json(result);
}
