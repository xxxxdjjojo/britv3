import { redirect } from "next/navigation";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { ProtectedHeader } from "@/components/layout/ProtectedHeader";
import { BottomTabBarWrapper } from "@/components/mobile/BottomTabBarWrapper";
import { PullToRefreshWrapper } from "@/components/mobile/PullToRefreshWrapper";
import { EmailVerifyBanner } from "@/components/auth/EmailVerifyBanner";
import { getCachedUser } from "@/lib/cached";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCachedUser();

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
      <main id="main-content" className="pb-16 lg:pb-0">{children}</main>
      <BottomTabBarWrapper />
    </QueryProvider>
  );
}
