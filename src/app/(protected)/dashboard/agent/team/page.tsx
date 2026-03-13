import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTeamMembers, getBranches } from "@/services/agent/agent-team-service";
import { TeamMemberList } from "@/components/dashboard/agent/team/TeamMemberList";
import type { AgentTeamMember, AgentBranch } from "@/types/agent";

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let members: AgentTeamMember[] = [];
  let branches: (AgentBranch & { member_count: number })[] = [];

  try {
    [members, branches] = await Promise.all([
      getTeamMembers(supabase, user.id),
      getBranches(supabase, user.id),
    ]);
  } catch {
    // Fall back to empty arrays on error
  }

  return <TeamMemberList initialMembers={members} branches={branches} />;
}
