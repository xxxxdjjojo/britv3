/**
 * Didit v3 session status → internal KycStatus.
 *
 * "Not Started" / "In Progress" map to pending (the user is mid-flow).
 * Unknown statuses map to undefined — callers must ack without writing.
 */

import type { KycStatus } from "@/services/verification/kyc-provider";

export const KYC_STATUS_BY_DIDIT_STATUS: Readonly<
  Record<string, Exclude<KycStatus, "not_started">>
> = {
  "Not Started": "pending",
  "In Progress": "pending",
  "In Review": "pending",
  Approved: "verified",
  Declined: "failed",
  Abandoned: "failed",
  Expired: "failed",
  "KYC Expired": "failed",
};

export function mapDiditStatus(
  status: string | undefined | null,
): Exclude<KycStatus, "not_started"> | undefined {
  if (!status) return undefined;
  return KYC_STATUS_BY_DIDIT_STATUS[status];
}
