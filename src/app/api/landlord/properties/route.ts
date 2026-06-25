import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  createPortfolioProperty,
  LANDLORD_PROPERTY_TYPES,
} from "@/services/landlord/property-service";

const UK_POSTCODE = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i;

const CreatePropertySchema = z.object({
  address_line_1: z.string().min(5, "Address required"),
  address_line_2: z.string().optional(),
  city: z.string().min(2, "City required"),
  postcode: z.string().regex(UK_POSTCODE, "Valid UK postcode required"),
  property_type: z.enum(LANDLORD_PROPERTY_TYPES),
  bedrooms: z.coerce.number().int().min(0).max(20),
  bathrooms: z.coerce.number().min(1).max(10),
  monthly_rent: z.coerce.number().min(0).optional(),
});

/**
 * POST /api/landlord/properties
 * Create a property + rental listing for the authenticated landlord's portfolio.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreatePropertySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid property details", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await createPortfolioProperty(supabase, user.id, parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create property";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
