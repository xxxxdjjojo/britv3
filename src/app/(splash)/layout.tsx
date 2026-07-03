import type { ReactNode } from "react";
import Link from "next/link";
import { SPLASH_FOOTER } from "@/lib/coming-soon/config";

type SplashLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function SplashLayout({ children }: SplashLayoutProps) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-[#04130C] text-white">
      <header className="absolute inset-x-0 top-0 z-30 flex items-center px-6 py-6 sm:px-10 sm:py-8">
        <Link
          href="/"
          aria-label="TrueDeed home"
          className="text-lg font-semibold tracking-tight text-white transition-opacity duration-300 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FDCD74] focus-visible:ring-offset-2 focus-visible:ring-offset-[#04130C]"
        >
          TrueDeed
        </Link>
      </header>

      {children}

      <footer className="absolute inset-x-0 bottom-0 z-30 px-6 pb-6 sm:px-10 sm:pb-8">
        <p className="text-xs leading-relaxed tracking-wide text-white/45 sm:text-[0.8125rem]">
          {SPLASH_FOOTER}
        </p>
      </footer>
    </div>
  );
}
