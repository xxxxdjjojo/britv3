/**
 * PATCH /api/provider/placements/[id]
 *
 * Provider self-service: pause, resume, or cancel one of their own placements.
 * RLS guarantees a provider can only touch their own rows.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireProviderAccess } from "@/lib/api/provider-access";
import {
  cancelProviderPlacement,
  setProviderPlacementPaused,
} from "@/services/placements/placement-checkout-service";

const patchSchema = z.object({ action: z.enum(["pause", "resume", "cancel"]) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const providerAccess = await requireProviderAccess();
  if (providerAccess.response) return providerAccess.response;
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let parsed;
  try {
    parsed = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    if (parsed.action === "cancel") {
      await cancelProviderPlacement(supabase, user.id, id);
    } else {
      await setProviderPlacementPaused(supabase, user.id, id, parsed.action === "pause");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update placement";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
