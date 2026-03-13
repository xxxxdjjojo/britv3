import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { CookieConsentProvider } from "@/contexts/CookieConsentContext";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";
import type { ReactNode } from "react";

export default function MainLayout(props: Readonly<{ children: ReactNode }>) {
  return (
    <QueryProvider>
      <CookieConsentProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{props.children}</main>
          <Footer />
          <CookieConsentBanner />
        </div>
      </CookieConsentProvider>
    </QueryProvider>
  );
}
