import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SupportTicketAdminClient } from "@/components/admin/SupportTicketAdminClient";
import { Tier1ActionsPanel } from "@/components/admin/Tier1ActionsPanel";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTicketDetail } from "@/services/admin/support-admin-service";
import { actionsForTarget } from "@/services/admin/tier1-actions/registry";

export const dynamic = "force-dynamic";

export default async function AdminSupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await getTicketDetail(createAdminClient(), id);
  if (!ticket) notFound();

  const userTier1Actions = actionsForTarget("user").map((a) => ({
    key: a.key,
    label: a.label,
    description: a.description,
    risk: a.risk,
    reversible: a.reversible,
  }));

  return (
    <div>
      <AdminPageHeader
        eyebrow="Support Queue"
        title={ticket.subject}
        description={`${ticket.reference} · ${ticket.email} · ${ticket.category} · ${ticket.status}`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SupportTicketAdminClient ticket={ticket} />
        </div>
        <aside>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Tier-1 Actions
            </h2>
            {ticket.userId ? (
              <>
                <p className="mb-4 text-xs text-neutral-500">
                  Audited remediations for the account owner. Preview before running.
                </p>
                <Tier1ActionsPanel
                  actions={userTier1Actions}
                  targetId={ticket.userId}
                  ticketId={ticket.id}
                />
              </>
            ) : (
              <p className="text-xs text-neutral-500">
                This ticket has no linked account (guest), so account-scoped actions are
                unavailable.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
