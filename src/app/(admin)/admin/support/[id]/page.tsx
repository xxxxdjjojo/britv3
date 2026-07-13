import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SupportTicketAdminClient } from "@/components/admin/SupportTicketAdminClient";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTicketDetail } from "@/services/admin/support-admin-service";

export const dynamic = "force-dynamic";

export default async function AdminSupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await getTicketDetail(createAdminClient(), id);
  if (!ticket) notFound();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Support Queue"
        title={ticket.subject}
        description={`${ticket.reference} · ${ticket.email} · ${ticket.category} · ${ticket.status}`}
      />
      <SupportTicketAdminClient ticket={ticket} />
    </div>
  );
}
