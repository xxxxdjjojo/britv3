/**
 * SectionHeader — Stitch section title row.
 * Large heading on the left, optional green ALL-CAPS action link on the right
 * (e.g. "VIEW ALL", "SCHEDULE", "CHECK COMPLIANCE").
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type SectionHeaderProps = Readonly<{
  title: string;
  action?: { label: string; href: string };
  className?: string;
}>;

export function SectionHeader({ title, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <h2 className="font-heading text-lg font-bold tracking-tight text-neutral-900">
        {title}
      </h2>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-brand-primary transition-colors hover:text-brand-primary-dark"
        >
          {action.label}
          <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}
