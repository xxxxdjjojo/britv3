import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateViewingStatus, rescheduleViewing, addViewingFeedback } from "@/services/seller/viewing-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    action: "confirm" | "cancel" | "reschedule" | "feedback";
    notes?: string;
    new_datetime?: string;
    feedback?: string;
  };

  try {
    if (body.action === "confirm") {
      await updateViewingStatus(supabase, id, "confirmed", body.notes);
    } else if (body.action === "cancel") {
      await updateViewingStatus(supabase, id, "cancelled", body.notes);
    } else if (body.action === "reschedule" && body.new_datetime) {
      await rescheduleViewing(supabase, id, body.new_datetime, body.notes);
    } else if (body.action === "reschedule" && !body.new_datetime) {
      return NextResponse.json({ error: "new_datetime required for reschedule" }, { status: 400 });
    } else if (body.action === "feedback" && body.feedback) {
      await addViewingFeedback(supabase, id, body.feedback);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
