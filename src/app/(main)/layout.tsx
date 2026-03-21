import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";
import type { ReactNode } from "react";

export default function MainLayout(props: Readonly<{ children: ReactNode }>) {
  return (
    <QueryProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main id="main-content" className="flex-1">{props.children}</main>
          <Footer />
          <CookieConsentBanner />
        </div>
    </QueryProvider>
  );
}
