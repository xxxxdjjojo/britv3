import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getSaleProgressionById,
  advanceStage,
} from "@/services/seller/sale-progression-service";
import type { SaleStageNumber, SaleProgressionDocument } from "@/types/seller";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const progression = await getSaleProgressionById(supabase, id);
  if (!progression) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(progression);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    action: "advance_stage" | "update_contacts" | "update_documents";
    current_stage?: SaleStageNumber;
    contacts?: {
      solicitor_name?: string;
      solicitor_email?: string;
      solicitor_phone?: string;
      buyer_solicitor_name?: string;
      buyer_solicitor_email?: string;
      mortgage_broker_name?: string;
    };
    documents?: SaleProgressionDocument[];
  };

  try {
    if (body.action === "advance_stage" && body.current_stage) {
      await advanceStage(supabase, id, body.current_stage);
    } else if (body.action === "update_contacts" && body.contacts) {
      await supabase
        .from("sale_progression_stages")
        .update(body.contacts)
        .eq("id", id);
    } else if (body.action === "update_documents" && body.documents) {
      await supabase
        .from("sale_progression_stages")
        .update({ documents: body.documents })
        .eq("id", id);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
