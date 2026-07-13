import Link from "next/link";
import { LifeBuoy } from "lucide-react";

import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { createAdminClient } from "@/lib/supabase/admin";
import { listAllTickets } from "@/services/admin/support-admin-service";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  open: "bg-emerald-50 text-emerald-700",
  pending_internal: "bg-brand-primary/5 text-brand-primary",
  pending_customer: "bg-amber-50 text-amber-700",
  resolved: "bg-neutral-100 text-neutral-600",
  closed: "bg-neutral-100 text-neutral-500",
};

export default async function AdminSupportPage() {
  const tickets = await listAllTickets(createAdminClient());

  return (
    <div>
      <AdminPageHeader
        eyebrow="Operations"
        title="Support Queue"
        description="Customer support requests. Every reply and status change is recorded in the admin audit log."
      />

      {tickets.length === 0 ? (
        <AdminEmptyState
          icon={LifeBuoy}
          title="No support tickets"
          description="Tickets raised via the contact form appear here."
        />
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <Link
                href={`/admin/support/${ticket.id}`}
                className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-neutral-50"
              >
                <div>
                  <p className="font-medium text-neutral-900">{ticket.subject}</p>
                  <p className="text-xs text-neutral-500">
                    {ticket.reference} · {ticket.email} · {ticket.category}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_TONE[ticket.status] ?? "bg-neutral-100 text-neutral-600"}`}
                >
                  {ticket.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
