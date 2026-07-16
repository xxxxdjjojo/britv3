/**
 * Didit v3 session status → internal KycStatus.
 *
 * Keys are the exact Didit session-level status strings (per the Didit API):
 * Not Started, In Progress, In Review, Approved, Declined, Expired, Abandoned,
 * Kyc Expired, Resubmitted, Awaiting User.
 *
 * Non-terminal states (the user is mid-flow or must redo a step) map to
 * pending; terminal failures map to failed; approval maps to verified.
 * Unknown statuses map to undefined — callers must ack without writing.
 */

import type { KycStatus } from "@/services/verification/kyc-provider";

export const KYC_STATUS_BY_DIDIT_STATUS: Readonly<
  Record<string, Exclude<KycStatus, "not_started">>
> = {
  "Not Started": "pending",
  "In Progress": "pending",
  "In Review": "pending",
  "Awaiting User": "pending",
  Resubmitted: "pending",
  Approved: "verified",
  Declined: "failed",
  Abandoned: "failed",
  Expired: "failed",
  "Kyc Expired": "failed",
};

export function mapDiditStatus(
  status: string | undefined | null,
): Exclude<KycStatus, "not_started"> | undefined {
  if (!status) return undefined;
  return KYC_STATUS_BY_DIDIT_STATUS[status];
}
