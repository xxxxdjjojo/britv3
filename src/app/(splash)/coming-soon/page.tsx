import type { Metadata } from "next";
import { HeroVideo } from "@/components/coming-soon/HeroVideo";
import { ComingSoonExperience } from "@/components/coming-soon/ComingSoonExperience";
import { getWaitlistCount } from "@/services/waitlist/waitlist-service";
import { WAITLIST_BASELINE } from "@/lib/coming-soon/config";

export const metadata: Metadata = {
  title: "TrueDeed — Coming Soon",
  description:
    "TrueDeed is reinventing how Britain finds home. Join the early-access list for AI-matched property and verified professionals.",
  openGraph: {
    title: "TrueDeed — Coming Soon",
    description:
      "The way Britain finds home is about to change. Join the early-access list.",
    images: ["/coming-soon/opengraph-image"],
  },
};

type ComingSoonPageProps = Readonly<{
  searchParams: Promise<{ ref?: string }>;
}>;

export default async function ComingSoonPage({
  searchParams,
}: ComingSoonPageProps) {
  const { ref } = await searchParams;
  const count = await getWaitlistCount().catch(() => WAITLIST_BASELINE);

  return (
    <main className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 py-28 sm:px-10">
      <HeroVideo />
      <div className="w-full max-w-3xl">
        <ComingSoonExperience count={count} referredBy={ref ?? null} />
      </div>
    </main>
  );
}
