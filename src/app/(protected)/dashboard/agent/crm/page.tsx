import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCrmClients } from "@/services/agent/agent-crm-service";
import { ClientList } from "@/components/dashboard/agent/crm/ClientList";
import type { AgentCrmClient } from "@/types/agent";

export default async function CrmPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let clients: AgentCrmClient[] = [];
  let totalCount = 0;
  try {
    const result = await getCrmClients(supabase, user.id, { limit: 25 });
    clients = result.data;
    totalCount = result.count;
  } catch {
    clients = [];
    totalCount = 0;
  }

  return <ClientList initialClients={clients} initialCount={totalCount} />;
}
