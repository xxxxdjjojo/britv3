"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { AgentLead } from "@/types/agent";
import { Calendar, GripVertical } from "lucide-react";

const SOURCE_COLORS: Record<string, string> = {
  website: "bg-blue-50 text-blue-700",
  referral: "bg-emerald-50 text-emerald-700",
  portal: "bg-purple-50 text-purple-700",
  cold_call: "bg-amber-50 text-amber-700",
  walk_in: "bg-rose-50 text-rose-700",
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

  const sourceColorClass = SOURCE_COLORS[lead.source ?? ""] ?? "bg-neutral-100 text-neutral-600";

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
          className={`group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-150 overflow-hidden ${
            isDragging ? "shadow-xl ring-2 ring-brand-primary/30" : ""
          }`}
        >
          {/* Drag handle — accessible touch target 44x44px */}
          <div
            {...attributes}
            {...listeners}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center size-11 cursor-grab active:cursor-grabbing text-neutral-300 hover:text-neutral-500 transition-colors opacity-0 group-hover:opacity-100 z-10"
            aria-label="Drag to reorder"
          >
            <GripVertical className="size-4" />
          </div>

          <div className="p-3 pr-10">
            <div className="flex items-start gap-2.5">
              {/* Avatar */}
              <div className="size-8 rounded-full bg-brand-accent-light flex items-center justify-center shrink-0 text-brand-primary font-semibold text-xs">
                {initials}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[#1a1c1c] leading-snug truncate">
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
                <Calendar className="size-3" />
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
