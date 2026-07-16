/**
 * Stub KYC adapter — the default when no identity-verification vendor is wired.
 *
 * createSession() does not call any external service: it returns a deterministic
 * local reference and a "not_started" status with no redirect. This keeps the
 * KYC seam in place (interface + DB columns) at zero cost until an AML flow
 * activates a real provider (e.g. Stripe Identity / Didit).
 */

import { env } from "@/env";
import { DiditKycAdapter } from "@/services/verification/adapters/didit-kyc-adapter";
import type {
  KycProvider,
  KycSession,
  KycSessionRequest,
} from "@/services/verification/kyc-provider";

export class StubKycAdapter implements KycProvider {
  readonly name = "stub";

  async createSession(req: KycSessionRequest): Promise<KycSession> {
    return {
      providerRef: `stub_${req.userId}`,
      status: "not_started",
      redirectUrl: null,
    };
  }
}

let _provider: KycProvider | null = null;

/** Resolve the active KYC provider from KYC_PROVIDER (stub is the default). */
export function getKycProvider(): KycProvider {
  if (_provider) return _provider;
  _provider = env.KYC_PROVIDER === "didit" ? new DiditKycAdapter() : new StubKycAdapter();
  return _provider;
}

/** Test-only: clear the memoized provider. */
export function _resetKycProviderForTests(): void {
  _provider = null;
}
