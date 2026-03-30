import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCrmClients } from "@/services/agent/agent-crm-service";
import { ClientList } from "@/components/dashboard/agent/crm/ClientList";
import type { AgentCrmClient } from "@/types/agent";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "CRM Clients | Agent | Britestate",
};


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent() {
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
        <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1c]">
          CRM Clients
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your client relationships and contact records
        </p>
      </div>

      <ClientList clients={clients} />
    </div>
  );
}

export default function AgentCrmPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
