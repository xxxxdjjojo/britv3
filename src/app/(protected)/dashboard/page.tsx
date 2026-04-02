import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roleToRoute } from "./role-route-map";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's active role from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("active_role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.active_role) {
    // No roles assigned yet -- send to role selection
    redirect("/register/role-select");
  }

  // Redirect to role-specific dashboard
  redirect(`/dashboard/${roleToRoute(profile.active_role)}`);
}
