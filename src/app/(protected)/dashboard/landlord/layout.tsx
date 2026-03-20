import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandlordSidebar } from "@/components/landlord/LandlordSidebar";

export default async function LandlordLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("active_role")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("[landlord/layout] Profile query failed:", error.message);
      // Fail open — middleware already enforces role, so render the page
    } else if (profile?.active_role !== "landlord") {
      redirect(`/dashboard/${profile?.active_role ?? "homebuyer"}`);
    }
  } catch (err) {
    console.error("[landlord/layout] Unexpected error:", err);
    // Fail open — let middleware handle auth/role enforcement
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
