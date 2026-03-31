import type { ReactNode } from "react";

type AuthCardProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;

/**
 * Card container for auth form content.
 * Matches Stitch: white bg, rounded-2xl, shadow-xl, subtle border.
 */
export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={`rounded-2xl bg-white shadow-xl shadow-neutral-900/5 border border-neutral-200/30 p-8 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
