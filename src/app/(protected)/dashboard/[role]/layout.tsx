import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/auth";

const VALID_ROLES: UserRole[] = [
  "homebuyer",
  "renter",
  "seller",
  "landlord",
  "agent",
  "service_provider",
];

export default async function RoleDashboardLayout(
  props: Readonly<{
    children: React.ReactNode;
    params: Promise<{ role: string }>;
  }>,
) {
  const { role } = await props.params;

  if (!VALID_ROLES.includes(role as UserRole)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify user has this role; if missing (e.g. just registered), grant it
  const { data: userRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", role)
    .maybeSingle();

  if (!userRole) {
    // Auto-grant the role to prevent redirect loops after registration
    const { error } = await supabase
      .from("user_roles")
      .upsert(
        { user_id: user.id, role },
        { onConflict: "user_id,role" },
      );

    if (error) {
      redirect("/dashboard");
    }
  }

  return <>{props.children}</>;
}
