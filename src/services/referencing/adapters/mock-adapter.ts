 
/**
 * Mock referencing adapter — the default when no paid provider is configured.
 *
 * It does not call any external service: initiateCheck just mints a local
 * external reference, and parseWebhook verifies an HMAC-SHA256 signature
 * (REFERENCING_WEBHOOK_SECRET) so the webhook path can be exercised end-to-end
 * in tests/staging. A real adapter (e.g. Goodlord/HomeLet) implements the same
 * ReferencingProvider interface and drops in via the factory.
 */

import { createHmac, timingSafeEqual } from "crypto";
import type {
  ReferencingProvider,
  ReferencingRequest,
  ReferencingInitiation,
  ReferencingWebhookResult,
  ReferencingOutcome,
} from "@/services/referencing/referencing-provider";

const VALID_OUTCOMES: ReferencingOutcome[] = ["passed", "failed", "pending"];

function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export class MockReferencingAdapter implements ReferencingProvider {
  readonly name = "mock";

  async initiateCheck(req: ReferencingRequest): Promise<ReferencingInitiation> {
    // Deterministic, collision-resistant local reference (no Math.random — keeps
    // the function reproducible for Inngest replays).
    const externalRef = `mock_${req.applicationId}`;
    return { externalRef, status: "pending" };
  }

  parseWebhook(
    rawBody: string,
    signature: string | null,
  ): ReferencingWebhookResult | null {
    const secret = process.env.REFERENCING_WEBHOOK_SECRET;
    if (!secret || !signature) return null;

    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    if (!safeEqualHex(expected, signature)) {
      console.warn("[referencing:mock] webhook signature mismatch");
      return null;
    }

    let payload: { externalRef?: unknown; outcome?: unknown };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return null;
    }

    const externalRef = typeof payload.externalRef === "string" ? payload.externalRef : null;
    const outcome = payload.outcome as ReferencingOutcome;
    if (!externalRef || !VALID_OUTCOMES.includes(outcome)) return null;

    return { externalRef, outcome };
  }
}
