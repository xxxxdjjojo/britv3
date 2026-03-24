import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { respondToOffer, acceptOffer } from "@/services/seller/offer-service";
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

  if (body.action === "accept") {
    try {
      const result = await acceptOffer(supabase, id, {
        name: body.solicitor_name,
        email: body.solicitor_email,
        phone: body.solicitor_phone,
      });
      return NextResponse.json({ success: true, ...result });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("not owned")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      if (msg.includes("already been actioned")) return NextResponse.json({ error: "Offer already actioned" }, { status: 409 });
      console.error("[api/seller/offers/id] accept error:", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }

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
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("not owned by you")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (msg.includes("already actioned")) {
      return NextResponse.json({ error: "Offer already actioned" }, { status: 409 });
    }
    console.error("[api/seller/offers/id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
