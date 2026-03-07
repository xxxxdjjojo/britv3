import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reviewVerification } from "@/services/admin-service";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    userId: string;
    decision: "approved" | "rejected";
    notes?: string;
  };

  if (!body.userId || !body.decision) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = await createClient();
  const result = await reviewVerification(
    supabase,
    body.userId,
    body.decision,
    body.notes,
  );

  if (!result.success) {
    return NextResponse.json({ error: "Failed to review verification" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
