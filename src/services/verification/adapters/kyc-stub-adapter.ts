/**
 * Stub KYC adapter — the default when no identity-verification vendor is wired.
 *
 * createSession() does not call any external service: it returns a deterministic
 * local reference and a "not_started" status with no redirect. This keeps the
 * KYC seam in place (interface + DB columns) at zero cost until an AML flow
 * activates a real provider (e.g. Stripe Identity / Didit).
 */

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

/** Resolve the active KYC provider. Only the stub is wired today. */
export function getKycProvider(): KycProvider {
  if (_provider) return _provider;
  // Real adapters (stripe/didit) plug in here keyed on KYC_PROVIDER.
  _provider = new StubKycAdapter();
  return _provider;
}
