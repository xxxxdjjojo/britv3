import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AgentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_role")
    .eq("id", user.id)
    .single();

  if (profile?.active_role !== "agent") {
    redirect(`/dashboard/${profile?.active_role ?? "homebuyer"}`);
  }

  return <>{children}</>;
}
