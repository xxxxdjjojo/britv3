import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRateLimiter } from "@/lib/cache/redis";
import {
  lookupCompany,
  assessEligibility,
} from "@/services/verification/companies-house-service";

// 10 lookups per minute per user — fail-open (non-critical)
const lookupRateLimiter = createRateLimiter(10, "1 m");

const bodySchema = z.object({
  companyNumber: z
    .string()
    .trim()
    .min(6, "Company number must be at least 6 characters")
    .max(12, "Company number is too long"),
});

/**
 * POST /api/verification/company
 * Looks up a UK company and returns onboarding eligibility. The Companies
 * House API key is server-only, so the onboarding client calls this route.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success: rateLimitOk } = await lookupRateLimiter.limit(
    `verify:company:${user.id}`,
  );
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: "Too many lookups. Please wait before trying again." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const result = await lookupCompany(parsed.data.companyNumber);
  const { eligible, reason } = assessEligibility(result);

  // Persist the authoritative verification server-side. The onboarding trust
  // fields on agencies / service_provider_details are forced from this record
  // by DB trigger, so the browser can never self-mark "verified". A service
  // outage is recorded as pending_review (manual review), not as verified.
  if (eligible || result.serviceError) {
    const admin = createAdminClient();
    const { error: persistError } = await admin
      .from("company_verifications")
      .upsert(
        {
          user_id: user.id,
          company_number: parsed.data.companyNumber,
          status: result.serviceError ? "pending_review" : "verified",
          company_name: result.companyName ?? null,
          company_status: result.companyStatus ?? null,
          incorporation_date: result.incorporationDate ?? null,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    if (persistError) {
      return NextResponse.json(
        { error: "Could not record verification. Please try again." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    eligible,
    reason: reason ?? null,
    // `serviceError` lets the client route an outage to manual review rather
    // than treating it as a hard rejection.
    serviceError: result.serviceError ?? false,
    companyName: result.companyName ?? null,
    companyStatus: result.companyStatus ?? null,
    incorporationDate: result.incorporationDate ?? null,
  });
}
