import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BreadcrumbsWrapper } from "@/components/layout/BreadcrumbsWrapper";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";
import { siteNavigationJsonLd } from "@/lib/seo/navigation-jsonld";
import type { ReactNode } from "react";

export default function MainLayout(props: Readonly<{ children: ReactNode }>) {
  return (
    <QueryProvider>
        <div className="flex min-h-dvh flex-col">
          <Header />
          <BreadcrumbsWrapper />
          <main id="main-content" className="flex-1">{props.children}</main>
          <Footer />
          <CookieConsentBanner />
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavigationJsonLd) }}
        />
    </QueryProvider>
  );
}
