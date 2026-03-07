import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-8">
      <div className="w-full max-w-[480px]">
        {/* Britestate Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-primary">
              <span className="font-heading text-lg font-bold text-white">B</span>
            </div>
            <span className="font-heading text-2xl font-bold text-neutral-900">
              Britestate
            </span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="rounded-xl bg-white p-8 shadow-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
