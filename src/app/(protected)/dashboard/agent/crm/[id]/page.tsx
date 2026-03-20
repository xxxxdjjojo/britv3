import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCrmClientById } from "@/services/agent/agent-crm-service";
import { ClientProfile } from "@/components/dashboard/agent/crm/ClientProfile";
import type { AgentCrmClient } from "@/types/agent";

export const metadata = {
  title: "Client Profile | Agent",
};

type Props = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function AgentCrmClientPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let client: AgentCrmClient | null = null;

  try {
    client = await getCrmClientById(supabase, id, user.id);
  } catch {
    notFound();
  }

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ClientProfile client={client} />
    </div>
  );
}
