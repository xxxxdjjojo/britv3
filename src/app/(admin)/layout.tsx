import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import type { AdminRole } from "@/lib/admin-permissions";

export const metadata: Metadata = {
  title: "Admin - Britestate",
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, admin_role")
    .eq("id", user.id)
    .single();

  if (profile?.is_admin !== true) {
    redirect("/");
  }

  const adminRole = (profile as Record<string, unknown>).admin_role as AdminRole | undefined;
  if (!adminRole) {
    redirect("/forbidden");
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar adminRole={adminRole} />
      <main className="flex-1 p-4 sm:p-6 lg:pl-72 lg:pr-8 lg:py-8">{children}</main>
    </div>
  );
}
