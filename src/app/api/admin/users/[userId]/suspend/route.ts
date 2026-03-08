import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { suspendUser } from "@/services/admin-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const supabase = await createClient();
  const result = await suspendUser(supabase, userId);
  if (!result.success) {
    return NextResponse.json({ error: "Failed to suspend user" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
