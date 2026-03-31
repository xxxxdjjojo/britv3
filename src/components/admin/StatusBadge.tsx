import { cn } from "@/lib/utils";

type StatusVariant = "default" | "outline";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  approved: { label: "Approved", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  fulfilled: { label: "Fulfilled", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  published: { label: "Published", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  in_progress: {
    label: "In Progress",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  draft: { label: "Draft", className: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400" },
  suspended: { label: "Suspended", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  banned: { label: "Banned", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  failed: { label: "Failed", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  email_failed: {
    label: "Email Failed",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
  open: { label: "Open", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  resolved: { label: "Resolved", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  dismissed: {
    label: "Dismissed",
    className: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  },
  flagged: { label: "Flagged", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  cancelled: {
    label: "Cancelled",
    className: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  },
};

type Props = Readonly<{
  status: string;
  variant?: StatusVariant;
}>;

export function StatusBadge({ status, variant = "default" }: Props) {
  const mapped = STATUS_MAP[status.toLowerCase()] ?? {
    label: status,
    className: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 font-body text-xs font-medium",
        variant === "outline" && "bg-transparent border",
        mapped.className,
      )}
    >
      {mapped.label}
    </span>
  );
}
