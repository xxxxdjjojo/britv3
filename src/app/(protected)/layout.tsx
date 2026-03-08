import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { ProtectedHeader } from "@/components/layout/ProtectedHeader";
import { BottomTabBarWrapper } from "@/components/mobile/BottomTabBarWrapper";
import { PullToRefreshWrapper } from "@/components/mobile/PullToRefreshWrapper";
import { EmailVerifyBanner } from "@/components/auth/EmailVerifyBanner";

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

  const emailConfirmed = !!user.email_confirmed_at;

  return (
    <QueryProvider>
      <EmailVerifyBanner
        email={user.email ?? ""}
        emailConfirmed={emailConfirmed}
      />
      <ProtectedHeader />
      <PullToRefreshWrapper />
      <main className="pb-16 md:pb-0">{children}</main>
      <BottomTabBarWrapper />
    </QueryProvider>
  );
}
