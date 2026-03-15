import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TeamClient } from "@/components/admin/TeamClient";

export type TeamMember = {
  id: string;
  fullName: string | null;
  email: string | null;
  createdAt: string | null;
  isSuspended: boolean | null;
};

export default async function TeamPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, created_at, is_suspended")
    .eq("role", "admin")
    .order("created_at", { ascending: false });

  const members: TeamMember[] = (data ?? []).map((m) => ({
    id: m.id as string,
    fullName: m.full_name as string | null,
    email: m.email as string | null,
    createdAt: m.created_at as string | null,
    isSuspended: m.is_suspended as boolean | null,
  }));

  return (
    <div>
      <AdminPageHeader
        title="Team Members"
        description="View and manage admin users. Invite new team members via email."
      />

      <TeamClient members={members} />
    </div>
  );
}
