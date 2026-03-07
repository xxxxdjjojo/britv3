import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header will be added here when dashboard layout is built */}
      <div className="flex flex-1">
        {/* Sidebar area reserved for dashboard navigation */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
