import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function BrokerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_role")
    .eq("id", user.id)
    .single();

  if (profile?.active_role !== "mortgage_broker") {
    redirect(`/dashboard/${profile?.active_role ?? "homebuyer"}`);
  }

  // Render children directly — parent dashboard/layout.tsx provides the shared Sidebar.
  return <>{children}</>;
}
