import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * /inbox/[conversationId] → redirect to role-based dashboard messages.
 * Deep links are preserved via the canonical inbox route.
 */
type PageProps = Readonly<{
  params: Promise<{ conversationId: string }>;
}>;

export default async function ConversationRedirect({ params }: PageProps) {
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
