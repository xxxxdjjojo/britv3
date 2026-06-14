"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { AgentLead } from "@/types/agent";

type Props = Readonly<{
  lead: AgentLead;
  stageLabel: string;
  stageDot: string;
  stageBadge: string;
  relativeTime: string;
  initials: string;
}>;

export function LeadCard({
  lead,
  stageLabel,
  stageDot,
  stageBadge,
  relativeTime,
  initials,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <a
        href={`/dashboard/agent/leads/${lead.id}`}
        onClick={(e) => {
          if (isDragging) e.preventDefault();
        }}
        className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-0 items-center px-4 py-3 hover:bg-surface/60 transition-colors"
      >
        {/* Name + email */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="size-8 shrink-0 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold select-none">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-primary-dark truncate">
              {lead.contact_name}
            </p>
            {lead.contact_email && (
              <p className="text-xs text-muted-foreground truncate">
                {lead.contact_email}
              </p>
            )}
          </div>
        </div>

        {/* Source */}
        <div>
          {lead.source ? (
            <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
              {lead.source.replace(/_/g, " ")}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>

        {/* Property Interest (property_id placeholder) */}
        <div className="hidden md:block">
          <span className="text-xs text-muted-foreground">—</span>
        </div>

        {/* Status */}
        <div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${stageBadge}`}
          >
            <span className={`size-1.5 rounded-full shrink-0 ${stageDot}`} />
            {stageLabel}
          </span>
        </div>

        {/* Assigned To */}
        <div className="hidden lg:block">
          {lead.assigned_to ? (
            <span className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
              {lead.assigned_to}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Unassigned</span>
          )}
        </div>

        {/* Last Contact */}
        <div className="hidden lg:block">
          <span className="text-xs text-muted-foreground">{relativeTime}</span>
        </div>
      </a>
    </li>
  );
}
