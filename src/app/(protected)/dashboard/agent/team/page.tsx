import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTeamMembers, getBranches } from "@/services/agent/agent-team-service";
import { TeamMemberList } from "@/components/dashboard/agent/team/TeamMemberList";
import type { AgentTeamMember, AgentBranch } from "@/types/agent";

export const metadata = {
  title: "Team Members | Agent",
};

export default async function AgentTeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let members: AgentTeamMember[] = [];
  let branches: AgentBranch[] = [];

  try {
    [members, branches] = await Promise.all([
      getTeamMembers(supabase, user.id),
      getBranches(supabase, user.id),
    ]);
  } catch {
    // Service call failed — render empty state
  }

  return <TeamMemberList members={members} branches={branches} />;
}
