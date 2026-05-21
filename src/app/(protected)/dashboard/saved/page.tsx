import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roleToRoute } from "../role-route-map";

export default async function LegacySavedDashboardRedirect() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_role")
    .eq("id", user.id)
    .single();

  const roleRoute = roleToRoute(
    (profile as { active_role?: string } | null)?.active_role ?? "homebuyer",
  );

  redirect(`/dashboard/${roleRoute}/saved`);
}
