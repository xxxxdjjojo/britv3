import type { Metadata } from "next";
import { Toaster } from "sonner";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import OfflineIndicator from "@/components/pwa/OfflineIndicator";
import "./globals.css";

export const metadata: Metadata = {
  title: "Britestate | UK Property Portal",
  description:
    "Find, compare, and transact on UK properties with AI-powered matching, integrated services, and real-time transaction tracking.",
  keywords: [
    "UK property",
    "property portal",
    "estate agents",
    "buy property",
    "rent property",
    "property search",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <QueryProvider>
          <PostHogProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
            <OfflineIndicator />
            <InstallPrompt />
          </PostHogProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
