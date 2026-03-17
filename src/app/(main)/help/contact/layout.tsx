import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Support | Help | Britestate",
  description:
    "Get in touch with the Britestate support team. We respond within one business day.",
};

export default function HelpContactLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
