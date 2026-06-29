import { cn } from "@/lib/utils";
import { developmentStatusLabel, unitStatusLabel } from "@/lib/new-homes/format";
import type {
  DevelopmentStatus,
  DevelopmentUnitStatus,
} from "@/lib/new-homes/types";

const DEV_STATUS_STYLES: Record<DevelopmentStatus, string> = {
  available: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  coming_soon: "bg-amber-100 text-amber-900 ring-amber-600/20",
  reserved: "bg-orange-100 text-orange-900 ring-orange-600/20",
  sold_out: "bg-neutral-200 text-neutral-600 ring-neutral-500/20",
};

const UNIT_STATUS_STYLES: Record<DevelopmentUnitStatus, string> = {
  available: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  reserved: "bg-amber-100 text-amber-900 ring-amber-600/20",
  sold: "bg-neutral-200 text-neutral-500 ring-neutral-500/20",
};

const baseClass =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset";

export function DevelopmentStatusBadge({
  status,
  className,
}: Readonly<{ status: DevelopmentStatus; className?: string }>) {
  return (
    <span className={cn(baseClass, DEV_STATUS_STYLES[status], className)}>
      <span
        aria-hidden
        className="size-1.5 rounded-full bg-current opacity-70"
      />
      {developmentStatusLabel(status)}
    </span>
  );
}

export function UnitStatusBadge({
  status,
  className,
}: Readonly<{ status: DevelopmentUnitStatus; className?: string }>) {
  return (
    <span className={cn(baseClass, UNIT_STATUS_STYLES[status], className)}>
      {unitStatusLabel(status)}
    </span>
  );
}
