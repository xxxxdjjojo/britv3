import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Service Providers | TrueDeed",
  description:
    "Compare your shortlisted professionals side-by-side — ratings, pricing, qualifications and coverage.",
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
