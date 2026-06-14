/**
 * Shared Truedeed Phase 1 types (introductions ledger).
 *
 * Single source of truth for services, API routes, and UI components.
 * Status / contact / event unions mirror the check constraints in
 * supabase/migrations/20260612000000_truedeed_introductions.sql.
 */

/** First-contact channel recorded on the introduction. */
export type IntroductionContactType = "enquiry" | "viewing_request" | "message";

/** Introduction lifecycle status (introduction_status_history.status). */
export type IntroductionStatus =
  | "active"
  | "rebutted"
  | "cancelled_manifest_error"
  | "converted_sstc"
  | "converted_exchanged"
  | "converted_completed"
  | "expired";

/** Event-trail entry types (introduction_events.event_type). */
export type IntroductionEventType =
  | "enquiry"
  | "viewing_requested"
  | "viewing_booked"
  | "viewing_attended"
  | "viewing_cancelled"
  | "message_sent"
  | "offer_relayed"
  | "note";

/** Admin decision on a rebuttal. */
export type RebuttalDecision = "upheld" | "rejected";

/**
 * Row shape for the agent introductions-ledger table
 * (dashboard/agent/introductions).
 */
export type AgentIntroduction = {
  id: string;
  applicantName: string;
  listingAddress: string;
  contactType: IntroductionContactType;
  occurredAt: string;
  status: IntroductionStatus;
  rebuttalDeadline: string | null;
  rebuttalOpen: boolean;
};

/**
 * Item shape for the admin pending-rebuttal moderation queue
 * (admin/truedeed/rebuttals).
 */
export type PendingRebuttal = {
  rebuttalId: string;
  introduction: {
    applicantName: string;
    listingAddress: string;
    occurredAt: string;
  };
  evidenceDatedAt: string;
  evidenceUrls: string[];
  submittedAt: string;
  branchName: string;
};

/** Agent-reported deal outcome (reported_outcomes.outcome). */
export type OutcomeType =
  | "offer_accepted"
  | "exchanged"
  | "completed"
  | "fell_through"
  | "tenancy_commenced"
  | "tenancy_abandoned";

/** Input for outcome-service reportOutcome (agent outcome-report form). */
export type ReportOutcomeInput = {
  introductionId: string;
  reportedBy: string;
  outcome: OutcomeType;
  completionDate?: Date;
  agreedPricePence?: number;
};

/**
 * Item shape for the admin invoice-candidate review queue
 * (admin/truedeed/candidates): candidate + introduction facts + outcome.
 */
export type CandidateReviewItem = {
  candidateId: string;
  source: "agent_report" | "audit_match";
  status: "pending_review" | "on_hold_branch_query";
  amountPence: number | null;
  vatPence: number | null;
  holdExpiresAt: string | null;
  introduction: {
    applicantName: string;
    occurredAt: string;
    notifiedAt: string | null;
    rebuttalDeadline: string | null;
    listingAddress: string;
    eventsCount: number;
  };
  outcome: {
    outcome: OutcomeType;
    completionDate: string | null;
    agreedPricePence: number | null;
  } | null;
};
