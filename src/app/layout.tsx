import type { Metadata, Viewport } from "next";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk"),
  title: {
    template: "%s | Britestate",
    default: "Britestate | UK Property Portal",
  },
  description:
    "Find your perfect UK property. Search, compare, and transact with AI-powered matching, verified agents, and trusted tradespeople.",
  openGraph: {
    type: "website",
    siteName: "Britestate",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    site: "@britestate",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(webSiteJsonLd) }} />
      </body>
    </html>
  );
}
