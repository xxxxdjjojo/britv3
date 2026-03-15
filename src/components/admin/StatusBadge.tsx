import { cn } from "@/lib/utils";

type StatusVariant = "default" | "outline";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-100 text-green-700" },
  approved: { label: "Approved", className: "bg-green-100 text-green-700" },
  fulfilled: { label: "Fulfilled", className: "bg-green-100 text-green-700" },
  published: { label: "Published", className: "bg-green-100 text-green-700" },
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
  in_progress: {
    label: "In Progress",
    className: "bg-yellow-100 text-yellow-700",
  },
  draft: { label: "Draft", className: "bg-neutral-100 text-neutral-600" },
  suspended: { label: "Suspended", className: "bg-red-100 text-red-700" },
  banned: { label: "Banned", className: "bg-red-100 text-red-700" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
  failed: { label: "Failed", className: "bg-red-100 text-red-700" },
  email_failed: {
    label: "Email Failed",
    className: "bg-orange-100 text-orange-700",
  },
  open: { label: "Open", className: "bg-blue-100 text-blue-700" },
  resolved: { label: "Resolved", className: "bg-green-100 text-green-700" },
  dismissed: {
    label: "Dismissed",
    className: "bg-neutral-100 text-neutral-600",
  },
  flagged: { label: "Flagged", className: "bg-orange-100 text-orange-700" },
  cancelled: {
    label: "Cancelled",
    className: "bg-neutral-100 text-neutral-600",
  },
};

type Props = Readonly<{
  status: string;
  variant?: StatusVariant;
}>;

export function StatusBadge({ status, variant = "default" }: Props) {
  const mapped = STATUS_MAP[status.toLowerCase()] ?? {
    label: status,
    className: "bg-neutral-100 text-neutral-600",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "outline" && "bg-transparent border",
        mapped.className,
      )}
    >
      {mapped.label}
    </span>
  );
}
