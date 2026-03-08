import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveReport } from "@/services/admin-service";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    reportId: string;
    resolution: "resolved" | "dismissed";
    note?: string;
    adminId: string;
  };

  if (!body.reportId || !body.resolution) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = await createClient();
  const result = await resolveReport(
    supabase,
    body.reportId,
    body.resolution,
    body.note,
    body.adminId,
  );

  if (!result.success) {
    return NextResponse.json({ error: "Failed to resolve report" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
