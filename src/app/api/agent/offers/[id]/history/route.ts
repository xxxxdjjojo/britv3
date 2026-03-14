import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOfferHistory } from "@/services/agent/agent-offer-service";

/**
 * GET /api/agent/offers/[id]/history
 *
 * Returns the history entries for a specific offer.
 * The authenticated user must be the agent who manages the offer.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: offerId } = await params;

    if (!offerId) {
      return NextResponse.json({ error: "Offer ID is required" }, { status: 400 });
    }

    const history = await getOfferHistory(supabase, offerId);

    return NextResponse.json({ history });
  } catch (error) {
    console.error("GET /api/agent/offers/[id]/history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
