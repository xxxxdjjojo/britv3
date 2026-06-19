import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Maintenance | TrueDeed",
  robots: { index: false },
};

export default function MaintenanceLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}
