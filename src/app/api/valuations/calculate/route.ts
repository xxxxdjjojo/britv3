import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionByToken, saveResult } from "@/services/valuation/session-repo";
import { calculateValuation } from "@/services/valuation/valuation-service";
import { buildSubject } from "@/lib/valuation/subject";
import { VALUATION_SESSION_COOKIE } from "@/lib/valuation/session-token";
import { captureException } from "@/lib/observability/capture-exception";
import { createClient } from "@/lib/supabase/server";

/**
 * Calculate and persist the valuation server-side. The figure is NOT returned
 * here — it is revealed only after email verification (see the journey). The
 * response just confirms the estimate is ready.
 */
export async function POST(): Promise<NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get(VALUATION_SESSION_COOKIE)?.value;
  const session = token ? await getSessionByToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "No active valuation session" }, { status: 400 });
  }
  if (!session.address || !session.details) {
    return NextResponse.json({ error: "Address and details are required first" }, { status: 400 });
  }

  try {
    // If the visitor is already signed in (e.g. recalculating from the result
    // page), own the new versioned result immediately so it's viewable without
    // re-verifying. Anonymous first-timers claim it after email verification.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const subject = buildSubject(session.address, session.details);
    const valuationDate = new Date().toISOString().slice(0, 10);
    const result = await calculateValuation({ subject, valuationDate });
    const resultId = await saveResult(session.id, subject, result, user?.id ?? null);

    // Privacy-safe: evidence rating + fallback level only (never the figure here).
    return NextResponse.json({
      ready: true,
      evidenceQuality: result.evidenceQuality,
      fallbackLevel: result.fallbackLevel,
      // Only returned to an already-authenticated owner (skip re-verification).
      resultId: user ? resultId : null,
    });
  } catch (err) {
    captureException(err, {
      module: "valuation",
      feature: "calculate",
      route: "/api/valuations/calculate",
      operation: "calculateValuation",
    });
    return NextResponse.json({ error: "Could not calculate your estimate." }, { status: 500 });
  }
}
