import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Call the DB function
    const { data, error } = await supabase.rpc("calculate_profile_score", {
      p_user_id: user.id,
    });

    if (error) {
      console.error("[Profile Score] RPC error:", error);
      return NextResponse.json({ error: "Score calculation failed" }, { status: 500 });
    }

    return NextResponse.json({ score: data });
  } catch (err) {
    console.error("[Profile Score] Unexpected error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
