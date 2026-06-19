import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works | TrueDeed",
  description:
    "Learn how TrueDeed works for buyers, sellers, landlords, agents, and tradespeople. Simple steps to navigate the UK property market.",
};

export default function HowItWorksLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
