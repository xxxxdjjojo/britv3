import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | TrueDeed Tools",
    default: "Property Tools | TrueDeed",
  },
  description:
    "Free property calculators and tools to help you make informed decisions about buying, selling, and renting in the UK.",
};

export default function ToolsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-surface">
      {children}
    </div>
  );
}
