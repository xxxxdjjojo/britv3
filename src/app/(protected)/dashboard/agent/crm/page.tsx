import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCrmClients } from "@/services/agent/agent-crm-service";
import { ClientList } from "@/components/dashboard/agent/crm/ClientList";
import type { AgentCrmClient } from "@/types/agent";

export const metadata = {
  title: "CRM Clients | Agent",
};

export default async function AgentCrmPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let clients: AgentCrmClient[] = [];

  try {
    clients = await getCrmClients(supabase, user.id, { limit: 200 });
  } catch {
    // Service call failed — render empty list
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">CRM Clients</h1>
        <p className="text-muted-foreground">
          Manage your client relationships and contact records
        </p>
      </div>

      <ClientList clients={clients} />
    </div>
  );
}
