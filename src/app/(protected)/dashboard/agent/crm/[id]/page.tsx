import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCrmClientById } from "@/services/agent/agent-crm-service";
import { ClientProfile } from "@/components/dashboard/agent/crm/ClientProfile";

export default async function CrmClientPage(
  props: Readonly<{ params: Promise<{ id: string }> }>,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await props.params;

  try {
    const client = await getCrmClientById(supabase, id, user.id);
    return <ClientProfile initialClient={client} />;
  } catch {
    notFound();
  }
}
