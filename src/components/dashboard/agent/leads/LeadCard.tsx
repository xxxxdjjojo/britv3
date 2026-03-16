"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import type { AgentLead } from "@/types/agent";

const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function LeadCard(
  props: Readonly<{ lead: AgentLead; isDragOverlay?: boolean }>
) {
  const { lead, isDragOverlay } = props;
  const router = useRouter();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isStale =
    Date.now() - new Date(lead.updated_at).getTime() > STALE_THRESHOLD_MS;

  const handleClick = () => {
    if (!isDragOverlay) {
      router.push(`/dashboard/agent/leads/${lead.id}`);
    }
  };

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={isDragOverlay ? undefined : style}
      {...(isDragOverlay ? {} : attributes)}
      {...(isDragOverlay ? {} : listeners)}
      onClick={handleClick}
      className={[
        "rounded-lg border bg-white p-3 shadow-sm transition-shadow",
        "hover:shadow-md cursor-grab active:cursor-grabbing",
        isDragOverlay ? "shadow-lg rotate-2" : "",
        "dark:bg-gray-900 dark:border-gray-700",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
          {lead.contact_name}
        </p>
        {isStale && (
          <span className="shrink-0 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            No contact 7d+
          </span>
        )}
      </div>
      {lead.contact_email && (
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
          {lead.contact_email}
        </p>
      )}
      <div className="flex items-center justify-between mt-2">
        {lead.source && (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {formatLabel(lead.source)}
          </span>
        )}
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
          {formatRelativeTime(lead.updated_at)}
        </span>
      </div>
    </div>
  );
}
