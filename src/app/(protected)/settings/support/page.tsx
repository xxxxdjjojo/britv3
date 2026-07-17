import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import {
  type TicketStatus,
  listTicketsForUser,
} from "@/services/support/ticket-service";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Open",
  pending_customer: "Awaiting your reply",
  pending_internal: "With our team",
  resolved: "Resolved",
  closed: "Closed",
};

const STATUS_TONE: Record<TicketStatus, string> = {
  open: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending_customer: "bg-amber-50 text-amber-700 border-amber-200",
  pending_internal: "bg-brand-primary/5 text-brand-primary border-brand-primary/20",
  resolved: "bg-neutral-100 text-neutral-600 border-neutral-200",
  closed: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function SupportRequestsPage() {
  const supabase = await createClient();
  const tickets = await listTicketsForUser(supabase);

  return (
    <div>
      <h1 className="mb-1 font-heading text-2xl font-bold text-neutral-900">Support requests</h1>
      <p className="mb-6 text-sm text-neutral-600">
        Requests you&apos;ve raised with us. Need something new?{" "}
        <Link
          href="/help/contact"
          className="font-medium text-brand-primary underline underline-offset-2"
        >
          Contact support
        </Link>
        .
      </p>

      {tickets.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
          You haven&apos;t raised any support requests yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {tickets.map((ticket) => (
            <li
              key={ticket.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4"
            >
              <div>
                <p className="font-medium text-neutral-900">{ticket.subject}</p>
                <p className="text-xs text-neutral-500">
                  {ticket.reference} · raised {formatDate(ticket.createdAt)}
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_TONE[ticket.status]}`}
              >
                {STATUS_LABEL[ticket.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
