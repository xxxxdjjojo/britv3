import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SellerSidebar } from "@/components/seller/SellerSidebar";

export default async function SellerDashboardLayout(
  props: Readonly<{ children: React.ReactNode }>,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name:display_name, avatar_url, active_role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.active_role !== "seller") {
    redirect(`/dashboard/${profile?.active_role ?? "homebuyer"}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <SellerSidebar
        userName={profile?.full_name ?? "Seller"}
        avatarUrl={profile?.avatar_url ?? null}
      />
      <main className="flex-1 min-h-screen p-4 sm:p-6 lg:pl-72 lg:pr-8 lg:py-8">
        {props.children}
      </main>
    </div>
  );
}
