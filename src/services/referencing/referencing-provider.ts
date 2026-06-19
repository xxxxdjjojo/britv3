/**
 * Provider-agnostic tenant referencing interface.
 *
 * The app talks only to this interface; a concrete adapter (mock today, a real
 * paid provider later) is selected by the REFERENCING_PROVIDER env var. This
 * keeps the paid integration swappable and cost-neutral until a vendor is wired.
 */

export type ReferencingRequest = Readonly<{
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  monthlyIncome?: number | null;
  employmentStatus?: string | null;
}>;

export type ReferencingInitiation = Readonly<{
  /** The provider's reference for this check, stored for webhook correlation. */
  externalRef: string;
  status: "pending";
}>;

export type ReferencingOutcome = "passed" | "failed" | "pending";

export type ReferencingWebhookResult = Readonly<{
  externalRef: string;
  outcome: ReferencingOutcome;
}>;

export interface ReferencingProvider {
  /** Provider identifier persisted on the application (matches REFERENCING_PROVIDER). */
  readonly name: string;

  /** Start a referencing check. Returns the provider's external reference. */
  initiateCheck(req: ReferencingRequest): Promise<ReferencingInitiation>;

  /**
   * Parse and verify an inbound provider webhook. Returns null when the
   * signature is invalid or the payload is unrecognised.
   */
  parseWebhook(
    rawBody: string,
    signature: string | null,
  ): ReferencingWebhookResult | null;
}
