import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RolesClient } from "@/components/admin/RolesClient";

const ALL_ROLES = [
  "homebuyer",
  "renter",
  "seller",
  "landlord",
  "estate_agent",
  "service_provider",
  "admin",
] as const;

type RoleCount = {
  role: string;
  count: number;
};

export default async function RolesPage() {
  const supabase = await createClient();

  // Count users per role in a single query
  const counts: RoleCount[] = [];
  for (const role of ALL_ROLES) {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", role);
    counts.push({ role, count: count ?? 0 });
  }

  return (
    <div>
      <AdminPageHeader
        title="Roles & Permissions"
        description="View user counts per role and manage admin promotions."
      />
      <RolesClient roleCounts={counts} />
    </div>
  );
}
