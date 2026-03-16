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
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <SellerSidebar
        userName={profile?.full_name ?? "Seller"}
        avatarUrl={profile?.avatar_url ?? null}
      />
      <main className="ml-64 flex-1 p-8 min-h-screen">
        {props.children}
      </main>
    </div>
  );
}
