import { NextResponse } from "next/server";
import { createAuthRateLimiter } from "@/lib/cache/redis";
import { developmentLeadSchema } from "@/lib/new-homes/lead-schema";
import { createDevelopmentLead } from "@/services/new-homes/leads-service";

// 8 lead submissions per hour per IP. Fail CLOSED if Redis is unavailable —
// these submissions carry buyer PII, so abuse control must not silently lapse.
const leadRateLimiter = createAuthRateLimiter(8, "1 h");

export async function POST(request: Request): Promise<NextResponse> {
  // Take the first hop of x-forwarded-for; prefer Vercel's authoritative x-real-ip.
  const ip =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  const { success: rateLimitOk } = await leadRateLimiter.limit(ip);
  if (!rateLimitOk) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = developmentLeadSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const result = await createDevelopmentLead(parsed.data);
  if (!result.ok) {
    const status = result.error === "Development not found" ? 404 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ success: true, leadId: result.leadId });
}
