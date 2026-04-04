import { cn } from "@/lib/utils";

type StatusVariant = "default" | "outline";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-success-light text-success dark:bg-success/20 dark:text-success" },
  approved: { label: "Approved", className: "bg-success-light text-success dark:bg-success/20 dark:text-success" },
  fulfilled: { label: "Fulfilled", className: "bg-success-light text-success dark:bg-success/20 dark:text-success" },
  published: { label: "Published", className: "bg-success-light text-success dark:bg-success/20 dark:text-success" },
  pending: { label: "Pending", className: "bg-warning-light text-warning dark:bg-warning/20 dark:text-warning" },
  in_progress: {
    label: "In Progress",
    className: "bg-warning-light text-warning dark:bg-warning/20 dark:text-warning",
  },
  draft: { label: "Draft", className: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400" },
  suspended: { label: "Suspended", className: "bg-error-light text-error dark:bg-error/20 dark:text-error" },
  banned: { label: "Banned", className: "bg-error-light text-error dark:bg-error/20 dark:text-error" },
  rejected: { label: "Rejected", className: "bg-error-light text-error dark:bg-error/20 dark:text-error" },
  failed: { label: "Failed", className: "bg-error-light text-error dark:bg-error/20 dark:text-error" },
  email_failed: {
    label: "Email Failed",
    className: "bg-error-light text-error dark:bg-error/20 dark:text-error",
  },
  open: { label: "Open", className: "bg-warning-light text-warning dark:bg-warning/20 dark:text-warning" },
  resolved: { label: "Resolved", className: "bg-brand-accent-light text-brand-accent dark:bg-brand-accent/20 dark:text-brand-accent" },
  dismissed: {
    label: "Dismissed",
    className: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  },
  flagged: { label: "Flagged", className: "bg-warning-light text-warning dark:bg-warning/20 dark:text-warning" },
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
