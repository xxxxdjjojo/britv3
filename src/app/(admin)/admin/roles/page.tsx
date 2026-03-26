import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RolesClient } from "@/components/admin/RolesClient";
import { Skeleton } from "@/components/ui/skeleton";

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


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent() {
  const supabase = await createClient();

  // Get current user and their admin_role for super-admin gating
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let adminRole: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("admin_role")
      .eq("id", user.id)
      .single();
    adminRole = (profile as { admin_role?: string | null } | null)?.admin_role ?? null;
  }

  const isSuperAdmin = adminRole === "super_admin";

  // Count users per role in parallel
  const counts: RoleCount[] = await Promise.all(
    ALL_ROLES.map(async (role) => {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", role);
      return { role, count: count ?? 0 };
    }),
  );

  return (
    <div>
      <AdminPageHeader
        title="Roles & Permissions"
        description="View user counts per role and manage admin promotions."
      />
      <RolesClient roleCounts={counts} isSuperAdmin={isSuperAdmin} />
    </div>
  );
}

export default function RolesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
