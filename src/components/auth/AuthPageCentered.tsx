import type { ReactNode } from "react";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { AuthFooter } from "@/components/auth/AuthFooter";

type AuthPageCenteredProps = Readonly<{
  children: ReactNode;
}>;

/**
 * Type A: Centered layout
 * Used by: Login, Verify Email, Email Confirmed
 *
 * Renders a centered card on a subtle gradient background.
 * No side panel — logo is top-center, footer is bottom-center.
 */
export function AuthPageCentered({ children }: AuthPageCenteredProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#faf9f8] via-white to-[#f4f3f2]">
      {/* Top bar with logo */}
      <header className="flex shrink-0 justify-center px-6 pt-10">
        <AuthLogo />
      </header>

      {/* Centered content */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-[460px]">{children}</div>
      </main>

      {/* Footer */}
      <footer className="flex shrink-0 justify-center px-6 pb-10">
        <AuthFooter />
      </footer>
    </div>
  );
}
