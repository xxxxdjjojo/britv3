import type { TenancyStatus } from "@/types/landlord";

const STATUS_STYLES: Record<TenancyStatus, { bg: string; text: string; label: string }> = {
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
    bg: "bg-gray-100 dark:bg-gray-800/30",
    text: "text-gray-600 dark:text-gray-400",
    label: "Ended",
  },
  terminated: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-300",
    label: "Terminated",
  },
};

export function TenancyStatusBadge(
  props: Readonly<{ status: TenancyStatus }>,
) {
  const style = STATUS_STYLES[props.status] ?? STATUS_STYLES.ended;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}
