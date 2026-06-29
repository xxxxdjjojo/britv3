/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dashboardPathForRole } from "@/lib/routes";
import type { UserRole } from "@/types/auth";

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
    redirect(dashboardPathForRole(profile.active_role as UserRole));
  }

  // Render children directly — parent dashboard/layout.tsx provides the Sidebar
  return <>{children}</>;
}
