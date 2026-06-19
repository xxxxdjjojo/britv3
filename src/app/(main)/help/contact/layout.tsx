import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Support | Help | TrueDeed",
  description:
    "Get in touch with the TrueDeed support team. We respond within one business day.",
};

export default function HelpContactLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
