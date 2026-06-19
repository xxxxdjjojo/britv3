import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBranches, getTeamMembers } from "@/services/agent/agent-team-service";
import { BranchManager } from "@/components/dashboard/agent/team/BranchManager";
import type { AgentBranch, AgentTeamMember } from "@/types/agent";

export const metadata = {
  title: "Branch Management | Agent | TrueDeed",
};

export default async function BranchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let branches: AgentBranch[] = [];
  let members: AgentTeamMember[] = [];

  try {
    [branches, members] = await Promise.all([
      getBranches(supabase, user.id),
      getTeamMembers(supabase, user.id),
    ]);
  } catch {
    // Service call failed — render empty state
  }

  return <BranchManager branches={branches} members={members} />;
}
