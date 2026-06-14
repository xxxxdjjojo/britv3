import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SellerDashboardLayout(
  props: Readonly<{ children: React.ReactNode }>,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.active_role !== "seller") {
    redirect(`/dashboard/${profile?.active_role ?? "homebuyer"}`);
  }

  // Render children directly — parent dashboard/layout.tsx provides the shared Sidebar.
  return <>{props.children}</>;
}
