import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProviderSidebar } from "@/components/dashboard/provider/ProviderSidebar";

export default async function ProviderLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_role")
    .eq("id", user.id)
    .single();

  if (profile?.active_role !== "service_provider") {
    redirect(`/dashboard/${profile?.active_role ?? "homebuyer"}`);
  }

  return (
    <div className="flex min-h-screen">
      <ProviderSidebar />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:pl-72 lg:pr-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
