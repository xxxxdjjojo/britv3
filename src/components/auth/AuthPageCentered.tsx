import type { ReactNode } from "react";
import { AuthDecorativeBackground } from "@/components/auth/AuthDecorativeBackground";
import { AuthFooter } from "@/components/auth/AuthFooter";

type AuthPageCenteredProps = Readonly<{
  children: ReactNode;
  /** Whether to show decorative gradient blur circles. Defaults to true. */
  showBackground?: boolean;
}>;

/**
 * Type A: Centered layout
 * Used by: Login, Verify Email, Email Confirmed
 *
 * Renders a centered card on a subtle surface background with optional
 * decorative gradient blur circles. No side panel.
 */
export function AuthPageCentered({ children, showBackground = true }: AuthPageCenteredProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-surface">
      {showBackground && <AuthDecorativeBackground />}

      {/* Centered content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex shrink-0 justify-center px-6 pb-10">
        <AuthFooter variant="centered" />
      </footer>
    </div>
  );
}
