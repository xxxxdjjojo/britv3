import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { addApplicationAsLandlord } from "@/services/landlord/tenant-application-service";

const CreateApplicationSchema = z.object({
  property_id: z.string().uuid("A property must be selected"),
  applicant_name: z.string().min(2, "Applicant name required"),
  applicant_email: z.string().email("Valid email required"),
  monthly_income: z.coerce.number().min(0).optional(),
  employment_status: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/landlord/applications
 * Add a tenant application to a property the authenticated landlord owns.
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

  const parsed = CreateApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid application details", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const application = await addApplicationAsLandlord(supabase, user.id, parsed.data);
    return NextResponse.json(application);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add application";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
