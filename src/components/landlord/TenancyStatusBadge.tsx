import type { TenancyStatus } from "@/types/landlord";

type DisplayStatus = TenancyStatus | "expired";

const STATUS_STYLES: Record<DisplayStatus, { bg: string; text: string; label: string }> = {
  active: {
    bg: "bg-success-light dark:bg-success/10",
    text: "text-success dark:text-success",
    label: "Active",
  },
  ending_soon: {
    bg: "bg-warning-light dark:bg-warning/10",
    text: "text-warning dark:text-warning",
    label: "Ending Soon",
  },
  ended: {
    bg: "bg-neutral-100 dark:bg-neutral-900/30",
    text: "text-neutral-600 dark:text-neutral-500",
    label: "Ended",
  },
  terminated: {
    bg: "bg-error-light dark:bg-error/10",
    text: "text-error dark:text-error",
    label: "Terminated",
  },
  expired: {
    bg: "bg-error-light dark:bg-error/10",
    text: "text-error dark:text-error",
    label: "Expired",
  },
};

/**
 * Determine if the tenancy is expired based on its end date.
 * A tenancy is expired when the lease_end_date is in the past
 * and the status is still "active" or "ending_soon".
 */
export function isTenancyExpired(
  status: TenancyStatus,
  leaseEndDate: string | null | undefined,
): boolean {
  if (!leaseEndDate) return false;
  if (status !== "active" && status !== "ending_soon") return false;
  return new Date(leaseEndDate) < new Date();
}

export function TenancyStatusBadge(
  props: Readonly<{ status: TenancyStatus; leaseEndDate?: string | null }>,
) {
  const expired = isTenancyExpired(props.status, props.leaseEndDate);
  const displayStatus: DisplayStatus = expired ? "expired" : props.status;
  const style = STATUS_STYLES[displayStatus] ?? STATUS_STYLES.ended;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}
