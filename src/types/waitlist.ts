// Shared contract for the coming-soon waitlist API + service.
// Imported by the service, the API routes, the frontend, and the tests so the
// shape is agreed in exactly one place.

import type { HeadlineVariantId } from "@/components/coming-soon/variants";

/** A single waitlist queue status, as returned to the client. */
export type QueueStatus = Readonly<{
  /** Public referral code (also the share token). */
  code: string;
  /** Display position in the queue (1-based, includes baseline + referral boost). */
  position: number;
  /** Number of people who joined via this code. */
  referralCount: number;
  /** Total people on the list (real signups + baseline). */
  total: number;
}>;

/** Result of joining the waitlist. */
export type JoinResult = QueueStatus &
  Readonly<{
    /** True when the email was already on the list (idempotent re-submit). */
    alreadyJoined: boolean;
  }>;

export type JoinWaitlistInput = Readonly<{
  email: string;
  referredBy?: string | null;
  variant?: HeadlineVariantId | null;
}>;
