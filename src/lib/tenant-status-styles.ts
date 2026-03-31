/**
 * Shared STATUS_STYLES constant for tenant application status badges.
 * Used by both ApplicationPipelineCard and TenantScreeningClient to avoid
 * duplication and keep styling consistent across views.
 */

import type { TenantApplicationStatus } from "@/types/landlord";

export const STATUS_STYLES: Record<
  TenantApplicationStatus,
  { bg: string; text: string; dot: string; label: string }
> = {
  received: {
    bg: "bg-neutral-100 dark:bg-neutral-800/40",
    text: "text-neutral-700 dark:text-neutral-300",
    dot: "bg-neutral-400",
    label: "Received",
  },
  shortlisted: {
    bg: "bg-brand-accent/10 dark:bg-brand-accent/20",
    text: "text-brand-accent dark:text-brand-accent",
    dot: "bg-brand-accent",
    label: "Shortlisted",
  },
  referencing: {
    bg: "bg-warning/10 dark:bg-warning/20",
    text: "text-warning dark:text-warning",
    dot: "bg-warning",
    label: "Referencing",
  },
  approved: {
    bg: "bg-success/10 dark:bg-success/20",
    text: "text-success dark:text-success",
    dot: "bg-success",
    label: "Approved",
  },
  rejected: {
    bg: "bg-error/10 dark:bg-error/20",
    text: "text-error dark:text-error",
    dot: "bg-error",
    label: "Rejected",
  },
  withdrawn: {
    bg: "bg-neutral-100 dark:bg-neutral-800/40",
    text: "text-neutral-600 dark:text-neutral-400",
    dot: "bg-neutral-400",
    label: "Withdrawn",
  },
};
