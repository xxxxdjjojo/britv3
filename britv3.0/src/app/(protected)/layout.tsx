import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { ProtectedHeader } from "@/components/layout/ProtectedHeader";

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
    <QueryProvider>
      <ProtectedHeader />
      {children}
    </QueryProvider>
  );
}
