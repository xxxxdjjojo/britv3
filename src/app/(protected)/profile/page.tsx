import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProfilePageClient } from "./ProfilePageClient";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your Britestate profile, avatar, and settings.",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch active role to determine if provider tab should show
  let activeRole = "homebuyer";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("active_role")
      .eq("id", user.id)
      .single();

    if (profile) {
      activeRole = (profile as { active_role: string }).active_role;
    }
  }

  return <ProfilePageClient isProvider={activeRole === "service_provider"} />;
}
