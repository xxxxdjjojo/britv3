import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveDashboardDestination } from "@/lib/auth/admin-access";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's product role plus admin overlay from the profile row.
  const { data: profile } = await supabase
    .from("profiles")
    .select("active_role, is_admin, admin_role")
    .eq("id", user.id)
    .single();

  redirect(resolveDashboardDestination(profile));
}
