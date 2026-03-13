import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLeadById } from "@/services/agent/agent-lead-service";
import { LeadDetailTimeline } from "@/components/dashboard/agent/leads/LeadDetailTimeline";

export default async function LeadDetailPage(
  props: Readonly<{ params: Promise<{ id: string }> }>
) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    const { lead, activities } = await getLeadById(supabase, id, user.id);
    return <LeadDetailTimeline lead={lead} activities={activities} />;
  } catch {
    notFound();
  }
}
