/**
 * Milestone domain types -- transaction and service job progress tracking.
 * Mirrors the transaction_milestones and service_job_milestones tables
 * in 003_dashboards_communication.sql.
 */

// -- Enums -------------------------------------------------------------------

/** Status of a milestone step */
export type MilestoneStatus = "not_started" | "in_progress" | "completed";

/** The 8 steps in a UK property transaction pipeline */
export type TransactionMilestoneKey =
  | "offer_accepted"
  | "mortgage_submitted"
  | "survey_instructed"
  | "survey_completed"
  | "conveyancing_started"
  | "searches_completed"
  | "contracts_exchanged"
  | "completion";

/** The 5 steps in a service job lifecycle */
export type ServiceJobMilestoneKey =
  | "quote_accepted"
  | "job_scheduled"
  | "work_started"
  | "work_completed"
  | "payment_received";

// -- Table row types ---------------------------------------------------------

/** Mirrors public.transaction_milestones table */
export type TransactionMilestone = Readonly<{
  id: string;
  transaction_id: string;
  milestone_key: TransactionMilestoneKey;
  status: MilestoneStatus;
  updated_by: string;
  updated_at: Date;
  notes: string | null;
  completed_date: string | null;
}>;

/** Mirrors public.service_job_milestones table */
export type ServiceJobMilestone = Readonly<{
  id: string;
  booking_id: string;
  milestone_key: ServiceJobMilestoneKey;
  status: MilestoneStatus;
  updated_by: string;
  updated_at: Date;
  notes: string | null;
}>;

// -- Template types ----------------------------------------------------------

type MilestoneTemplate<K extends string> = Readonly<{
  key: K;
  label: string;
  description: string;
  order: number;
}>;

/** Template for initializing transaction milestones */
export const TRANSACTION_MILESTONE_TEMPLATE: ReadonlyArray<
  MilestoneTemplate<TransactionMilestoneKey>
> = [
  {
    key: "offer_accepted",
    label: "Offer Accepted",
    description: "Seller has formally accepted the buyer's offer",
    order: 1,
  },
  {
    key: "mortgage_submitted",
    label: "Mortgage Application Submitted",
    description: "Mortgage application submitted to lender for approval",
    order: 2,
  },
  {
    key: "survey_instructed",
    label: "Survey Instructed",
    description: "Property survey has been commissioned",
    order: 3,
  },
  {
    key: "survey_completed",
    label: "Survey Completed",
    description: "Property survey report received and reviewed",
    order: 4,
  },
  {
    key: "conveyancing_started",
    label: "Conveyancing Started",
    description: "Solicitors engaged and legal process initiated",
    order: 5,
  },
  {
    key: "searches_completed",
    label: "Searches Completed",
    description: "Local authority and environmental searches returned",
    order: 6,
  },
  {
    key: "contracts_exchanged",
    label: "Contracts Exchanged",
    description: "Contracts signed and exchanged -- legally binding commitment",
    order: 7,
  },
  {
    key: "completion",
    label: "Completion",
    description: "Keys handed over and ownership transferred",
    order: 8,
  },
] as const;

/** Template for initializing service job milestones */
export const SERVICE_JOB_MILESTONE_TEMPLATE: ReadonlyArray<
  MilestoneTemplate<ServiceJobMilestoneKey>
> = [
  {
    key: "quote_accepted",
    label: "Quote Accepted",
    description: "Customer has accepted the service provider's quote",
    order: 1,
  },
  {
    key: "job_scheduled",
    label: "Job Scheduled",
    description: "Work date and time agreed between parties",
    order: 2,
  },
  {
    key: "work_started",
    label: "Work Started",
    description: "Service provider has begun the work on-site",
    order: 3,
  },
  {
    key: "work_completed",
    label: "Work Completed",
    description: "Service provider has finished all work",
    order: 4,
  },
  {
    key: "payment_received",
    label: "Payment Received",
    description: "Full payment received and confirmed",
    order: 5,
  },
] as const;
