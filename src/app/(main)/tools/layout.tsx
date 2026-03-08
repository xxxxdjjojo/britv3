import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Britestate Tools",
    default: "Property Tools | Britestate",
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
    <div className="min-h-screen bg-neutral-50">
      {children}
    </div>
  );
}
