/**
 * SmartActionsCard.tsx
 *
 * Server component that renders the top priority action suggestions for a
 * provider on their dashboard home page. Each action links to the relevant
 * section of the dashboard so the provider can act immediately.
 */

import Link from "next/link";
import {
  Sparkles,
  Clock,
  PoundSterling,
  Inbox,
  FileCheck,
  Star,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SmartAction, SmartActionType } from "@/services/provider/provider-smart-actions-service";

// ---------------------------------------------------------------------------
// Icon map per action type
// ---------------------------------------------------------------------------

const ACTION_ICONS: Record<SmartActionType, React.ElementType> = {
  expiring_lead: Clock,
  overdue_invoice: PoundSterling,
  stale_job: AlertTriangle,
  unanswered_lead: Inbox,
  unbooked_quote: FileCheck,
  missing_cert: FileCheck,
  request_review: Star,
};

// ---------------------------------------------------------------------------
// Deadline badge
// ---------------------------------------------------------------------------

function DeadlineBadge({ deadline }: Readonly<{ deadline: string }>) {
  const diffMs = new Date(deadline).getTime() - Date.now();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  const isUrgent = diffHours < 6;
  const label =
    diffHours < 1
      ? "< 1 hour"
      : diffHours < 24
        ? `${diffHours}h left`
        : `${Math.floor(diffHours / 24)}d left`;

  return (
    <Badge
      className={
        isUrgent
          ? "bg-red-100 text-red-700 border-red-200 shrink-0"
          : "bg-amber-100 text-amber-700 border-amber-200 shrink-0"
      }
    >
      {label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Single action row
// ---------------------------------------------------------------------------

function ActionRow({ action }: Readonly<{ action: SmartAction }>) {
  const Icon = ACTION_ICONS[action.type] ?? Sparkles;

  return (
    <Link
      href={action.href}
      className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-neutral-50"
    >
      {/* Icon */}
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1B4D3E]/10 text-[#1B4D3E]">
        <Icon className="size-4" />
      </span>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-neutral-900 leading-tight">{action.title}</p>
          {action.deadline && <DeadlineBadge deadline={action.deadline} />}
        </div>
        <p className="mt-0.5 text-xs text-neutral-500 leading-relaxed">{action.description}</p>
      </div>

      {/* Arrow */}
      <ArrowRight className="mt-1 size-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <CheckCircle2 className="size-10 text-[#1B4D3E]/60" />
      <p className="text-sm font-medium text-neutral-700">All caught up!</p>
      <p className="text-xs text-neutral-500">No urgent actions right now.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SmartActionsCard
// ---------------------------------------------------------------------------

type SmartActionsCardProps = Readonly<{
  actions: SmartAction[];
}>;

export function SmartActionsCard({ actions }: SmartActionsCardProps) {
  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-neutral-900">
          <Sparkles className="size-4 text-[#1B4D3E]" />
          Suggested Actions
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        {actions.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {actions.map((action) => (
              <li key={action.id}>
                <ActionRow action={action} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
