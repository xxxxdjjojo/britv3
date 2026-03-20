import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { BreakpointProvider } from "@/contexts/BreakpointContext";
import { DevBreakpointIndicator } from "@/components/responsive/DevBreakpointIndicator";
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
  title: {
    template: "%s | Britestate",
    default: "Britestate | UK Property Portal",
  },
  description:
    "Find your perfect UK property. Search, compare, and transact with AI-powered matching, verified agents, and trusted tradespeople.",
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
        <PostHogProvider>
          <BreakpointProvider>
            <NuqsAdapter>{children}</NuqsAdapter>
            <DevBreakpointIndicator />
          </BreakpointProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
