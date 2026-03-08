import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { activateUser } from "@/services/admin-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const supabase = await createClient();
  const result = await activateUser(supabase, userId);
  if (!result.success) {
    return NextResponse.json({ error: "Failed to activate user" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
