/**
 * Provider-agnostic identity verification (KYC) interface — scaffold only.
 *
 * No live vendor is wired (KYC_PROVIDER defaults to "stub"). When an AML-gated
 * flow needs real identity verification, implement this interface with a
 * concrete adapter (Stripe Identity recommended — reuses the existing Stripe
 * account; Didit free-tier is the cheaper alternative) and select it in
 * getKycProvider().
 */

export type KycStatus = "not_started" | "pending" | "verified" | "failed";

export type KycSessionRequest = Readonly<{
  userId: string;
  email?: string | null;
  returnUrl?: string;
}>;

export type KycSession = Readonly<{
  /** Provider's verification reference, persisted as profiles.kyc_provider_ref. */
  providerRef: string;
  status: KycStatus;
  /** Hosted verification URL the user is redirected to (null for the stub). */
  redirectUrl: string | null;
}>;

export interface KycProvider {
  readonly name: string;
  /** Begin an identity verification session for a user. */
  createSession(req: KycSessionRequest): Promise<KycSession>;
}
