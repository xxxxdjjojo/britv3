import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandlordSidebar } from "@/components/landlord/LandlordSidebar";

export default async function LandlordLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_role")
    .eq("id", user.id)
    .single();

  if (profile?.active_role !== "landlord") {
    redirect(`/dashboard/${profile?.active_role ?? "homebuyer"}`);
  }

  return (
    <div className="flex min-h-screen">
      <LandlordSidebar />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:pl-72 lg:pr-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
