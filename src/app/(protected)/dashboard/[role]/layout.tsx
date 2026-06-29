import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROUTE_TO_ROLE } from "@/lib/constants";
import { dashboardPathForRole } from "@/lib/routes";
import type { UserRole } from "@/types/auth";

export default async function RoleDashboardLayout(
  props: Readonly<{
    children: React.ReactNode;
    params: Promise<{ role: string }>;
  }>,
) {
  const { role } = await props.params;
  const expectedRole = ROUTE_TO_ROLE[role];

  // Reject invalid role slugs before any DB call
  if (!expectedRole) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Defense-in-depth: Server Component calls getUser() independently of middleware
  if (authError || !user) {
    redirect("/login");
  }

  // Read active_role from profiles — this is the authoritative source
  // Never trust the URL parameter as the user's actual role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("active_role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login");
  }

  // Enforce: URL role must match active_role
  // Example: homebuyer at /dashboard/landlord → redirect to /dashboard/homebuyer
  const activeRole = profile.active_role as UserRole | null;
  if (activeRole !== expectedRole) {
    if (!activeRole) {
      redirect("/dashboard");
    }

    redirect(dashboardPathForRole(activeRole));
  }

  return <>{props.children}</>;
}
