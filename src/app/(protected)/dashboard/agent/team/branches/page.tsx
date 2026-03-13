import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBranches } from "@/services/agent/agent-team-service";
import { BranchManager } from "@/components/dashboard/agent/team/BranchManager";
import type { AgentBranch } from "@/types/agent";

export default async function BranchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let branches: (AgentBranch & { member_count: number })[] = [];
  try {
    branches = await getBranches(supabase, user.id);
  } catch {
    branches = [];
  }

  return <BranchManager initialBranches={branches} />;
}
