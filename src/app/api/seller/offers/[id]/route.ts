import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { respondToOffer } from "@/services/seller/offer-service";
import type { OfferStatus } from "@/types/seller";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    action: "accept" | "counter" | "reject";
    solicitor_name?: string;
    solicitor_email?: string;
    solicitor_phone?: string;
    counter_amount?: number;
    counter_message?: string;
  };

  const statusMap: Record<string, OfferStatus> = { accept: "accepted", counter: "countered", reject: "rejected" };
  const status = statusMap[body.action];
  if (!status) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  try {
    await respondToOffer(supabase, id, {
      status,
      solicitor_name: body.solicitor_name,
      solicitor_email: body.solicitor_email,
      solicitor_phone: body.solicitor_phone,
      counter_amount: body.counter_amount ? body.counter_amount * 100 : undefined,
      counter_message: body.counter_message,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/seller/offers/id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
