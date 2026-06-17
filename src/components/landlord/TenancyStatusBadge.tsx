import type { TenancyStatus } from "@/types/landlord";

type DisplayStatus = TenancyStatus | "expired";

const STATUS_STYLES: Record<DisplayStatus, { bg: string; text: string; label: string }> = {
  active: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-800 dark:text-green-300",
    label: "Active",
  },
  ending_soon: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-800 dark:text-amber-300",
    label: "Ending Soon",
  },
  ended: {
    bg: "bg-muted dark:bg-gray-800/30",
    text: "text-gray-600 dark:text-gray-400",
    label: "Ended",
  },
  terminated: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-300",
    label: "Terminated",
  },
  expired: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-300",
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
