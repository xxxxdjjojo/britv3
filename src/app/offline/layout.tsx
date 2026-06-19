import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Offline | TrueDeed",
  robots: { index: false },
};

export default function OfflineLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}
