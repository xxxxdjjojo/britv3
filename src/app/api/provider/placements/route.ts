/**
 * /api/provider/placements
 *
 * GET  — the authenticated provider's placements, performance, and the catalogue.
 * POST — start a boost-subscription Stripe Checkout for a chosen product.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireProviderAccess } from "@/lib/api/provider-access";
import {
  PlacementPurchaseError,
  createPlacementCheckout,
  listProviderPlacements,
} from "@/services/placements/placement-checkout-service";
import { getProviderPerformance } from "@/services/placements/placement-events-service";
import { listActiveProducts } from "@/services/placements/placement-product-service";

async function resolveProvider() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null };
  return { supabase, user };
}

export async function GET() {
  const providerAccess = await requireProviderAccess();
  if (providerAccess.response) return providerAccess.response;
  const { supabase, user } = await resolveProvider();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [placements, performance, products] = await Promise.all([
      listProviderPlacements(supabase, user.id),
      getProviderPerformance(supabase, user.id),
      listActiveProducts(supabase),
    ]);
    return NextResponse.json({ placements, performance, products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load placements";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const postSchema = z.object({ productId: z.string().uuid() });

export async function POST(request: NextRequest) {
  const providerAccess = await requireProviderAccess();
  if (providerAccess.response) return providerAccess.response;
  const { supabase, user } = await resolveProvider();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let parsed;
  try {
    parsed = postSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await createPlacementCheckout(supabase, {
      providerId: user.id,
      productId: parsed.productId,
      customerEmail: user.email ?? null,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof PlacementPurchaseError) {
      const status = error.code === "not_eligible" ? 403 : 409;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    const message = error instanceof Error ? error.message : "Failed to start checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
