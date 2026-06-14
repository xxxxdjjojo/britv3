import type { ActivityItem } from "@/services/provider/provider-dashboard-service";
import {
  Inbox,
  Briefcase,
  CheckCircle,
  CreditCard,
  Star,
  MessageSquare,
} from "lucide-react";

type ActivityFeedProps = Readonly<{
  items: ActivityItem[];
}>;

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  lead_received: Inbox,
  job_started: Briefcase,
  job_completed: CheckCircle,
  payment_received: CreditCard,
  review_posted: Star,
  message_received: MessageSquare,
};

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-500">
        No recent activity yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-neutral-100">
      {items.map((item) => {
        const Icon = ACTIVITY_ICONS[item.type] ?? Inbox;
        return (
          <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E8F5EE] text-brand-primary">
              <Icon className="size-4" />
            </span>
            <div className="flex flex-1 flex-col gap-0.5 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{item.label}</p>
              <p className="text-xs text-neutral-500">{relativeTime(item.createdAt)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
