import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function LandlordLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("active_role")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    console.error("[landlord/layout] Profile query failed:", error?.message);
    redirect("/login");
  }

  if (profile.active_role !== "landlord") {
    redirect(`/dashboard/${profile.active_role}`);
  }

  // Render children directly — parent dashboard/layout.tsx provides the Sidebar
  return <>{children}</>;
}
