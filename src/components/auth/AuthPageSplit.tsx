import type { ReactNode } from "react";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { AuthMarketingPanel } from "@/components/auth/AuthMarketingPanel";

type AuthPageSplitProps = Readonly<{
  children: ReactNode;
  /** Optional custom marketing panel content. Defaults to AuthMarketingPanel. */
  marketingPanel?: ReactNode;
}>;

/**
 * Type B: Split layout — imagery/marketing LEFT, form RIGHT
 * Used by: Sign Up, Password Reset
 *
 * On mobile only the right (form) panel is visible.
 * On md+ the left marketing panel is shown at 52% width.
 */
export function AuthPageSplit({ children, marketingPanel }: AuthPageSplitProps) {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* LEFT — Marketing panel (hidden on mobile) */}
      <div className="hidden md:block md:w-[52%]">
        {marketingPanel ?? <AuthMarketingPanel />}
      </div>

      {/* RIGHT — Form panel */}
      <div className="flex w-full flex-col overflow-y-auto px-6 py-10 md:w-[48%] md:px-12 lg:px-16">
        <AuthLogo className="mb-10" />

        <div className="flex flex-1 flex-col justify-center">
          <div className="w-full max-w-[460px]">{children}</div>
        </div>

        <AuthFooter className="mt-10" />
      </div>
    </div>
  );
}
