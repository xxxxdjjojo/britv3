import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * /inbox → redirect to role-based dashboard messages.
 * The canonical inbox lives at /dashboard/[role]/messages.
 */
export default async function InboxRedirect() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_role")
    .eq("id", user.id)
    .single();

  const role = profile?.active_role ?? "homebuyer";
  redirect(`/dashboard/${role}/messages`);
}
