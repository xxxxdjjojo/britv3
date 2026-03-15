import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { BranchManager } from "@/components/dashboard/agent/team/BranchManager";
import { getBranches, getTeamMembers } from "@/services/agent/agent-team-service";

export const metadata = {
  title: "Branch Management",
};

export default async function BranchesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let branches: Awaited<ReturnType<typeof getBranches>> = [];
  let members: Awaited<ReturnType<typeof getTeamMembers>> = [];

  try {
    [branches, members] = await Promise.all([
      getBranches(supabase, user.id),
      getTeamMembers(supabase, user.id),
    ]);
  } catch (err) {
    console.error("Failed to load branch data:", err);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Building2 className="size-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Branch Management
          </h1>
          <p className="text-muted-foreground">
            Manage your office locations and assign team members to branches.
          </p>
        </div>
      </div>

      <BranchManager initialBranches={branches} teamMembers={members} />
    </div>
  );
}
