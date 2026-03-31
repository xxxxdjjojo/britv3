"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { AgentLead } from "@/types/agent";
import { Calendar, GripVertical } from "lucide-react";

// Source badge colors using design-system semantic tokens
const SOURCE_COLORS: Record<string, string> = {
  website: "bg-info-light text-info",
  referral: "bg-success-light text-success",
  portal: "bg-[color-mix(in_srgb,var(--color-brand-secondary-light)_80%,transparent)] text-[color-mix(in_srgb,var(--color-brand-secondary)_90%,#000)]",
  cold_call: "bg-warning-light text-warning",
  walk_in: "bg-error-light text-error",
};

export function LeadCard({ lead }: Readonly<{ lead: AgentLead }>) {
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

  const sourceColorClass = SOURCE_COLORS[lead.source ?? ""] ?? "bg-muted text-muted-foreground";

  // Avatar initials
  const initials = lead.contact_name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div ref={setNodeRef} style={style}>
      <a
        href={`/dashboard/agent/leads/${lead.id}`}
        onClick={(e) => {
          if (isDragging) e.preventDefault();
        }}
        tabIndex={isDragging ? -1 : 0}
      >
        <div
          className={`group relative bg-card rounded-xl shadow-sm hover:shadow-md transition-all duration-150 overflow-hidden ${
            isDragging ? "shadow-xl ring-2 ring-brand-primary/30" : ""
          }`}
        >
          {/* Drag handle — accessible touch target 44x44px */}
          <div
            {...attributes}
            {...listeners}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center size-11 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors opacity-0 group-hover:opacity-100 z-10"
            aria-label="Drag to reorder"
          >
            <GripVertical className="size-4" strokeWidth={1.25} />
          </div>

          <div className="p-3 pr-10">
            <div className="flex items-start gap-2.5">
              {/* Avatar */}
              <div className="size-8 rounded-full bg-accent flex items-center justify-center shrink-0 text-accent-foreground font-semibold text-xs">
                {initials}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground leading-snug truncate">
                  {lead.contact_name}
                </p>
                {lead.contact_email && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {lead.contact_email}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-2.5 gap-2">
              {lead.source ? (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sourceColorClass}`}>
                  {lead.source.charAt(0).toUpperCase() + lead.source.slice(1).replace(/_/g, " ")}
                </span>
              ) : (
                <span />
              )}
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Calendar className="size-3" strokeWidth={1.25} />
                {new Date(lead.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}
