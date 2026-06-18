import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionByToken, saveResult } from "@/services/valuation/session-repo";
import { calculateValuation } from "@/services/valuation/valuation-service";
import { buildSubject } from "@/lib/valuation/subject";
import { VALUATION_SESSION_COOKIE } from "@/lib/valuation/session-token";
import { captureException } from "@/lib/observability/capture-exception";

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
    const subject = buildSubject(session.address, session.details);
    const valuationDate = new Date().toISOString().slice(0, 10);
    const result = await calculateValuation({ subject, valuationDate });
    await saveResult(session.id, subject, result);

    // Privacy-safe: evidence rating + fallback level only (never the figure here).
    return NextResponse.json({
      ready: true,
      evidenceQuality: result.evidenceQuality,
      fallbackLevel: result.fallbackLevel,
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
