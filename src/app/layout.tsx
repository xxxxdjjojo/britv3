import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { CookieConsentProvider } from "@/contexts/CookieConsentContext";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { BreakpointProvider } from "@/contexts/BreakpointContext";
import { CommandPaletteProvider } from "@/contexts/CommandPaletteContext";
import { CommandPaletteLazy } from "@/components/layout/CommandPaletteLazy";
import { DevBreakpointIndicator } from "@/components/responsive/DevBreakpointIndicator";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/seo/organization-jsonld";
import { safeJsonLd } from "@/lib/seo/safe-json-ld";
import { appBaseUrl, brandConfig } from "@/config/brand";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl()),
  title: {
    template: `%s | ${brandConfig.displayName}`,
    default: `${brandConfig.displayName} | UK Property Portal`,
  },
  description:
    "Find your perfect UK property. Search, compare, and transact with AI-powered matching, verified agents, and trusted tradespeople.",
  openGraph: {
    type: "website",
    siteName: brandConfig.displayName,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    site: brandConfig.social.twitterHandle,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${plusJakartaSans.variable} ${inter.variable} antialiased`}
      >
        <CookieConsentProvider>
          <PostHogProvider>
            <BreakpointProvider>
              <CommandPaletteProvider>
                <NuqsAdapter>{children}</NuqsAdapter>
                <CommandPaletteLazy />
              </CommandPaletteProvider>
              <DevBreakpointIndicator />
            </BreakpointProvider>
          </PostHogProvider>
        </CookieConsentProvider>
        <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationJsonLd) }} />
        <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: safeJsonLd(webSiteJsonLd) }} />
      </body>
    </html>
  );
}
