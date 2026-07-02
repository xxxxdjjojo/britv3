import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PledgeArticle } from "@/components/pledges/PledgeArticle";
import { getPledge } from "@/config/pledges";
import { brandConfig, appBaseUrl } from "@/config/brand";

const SLUG = "no-premium-placement";
const pledge = getPledge(SLUG);

export const metadata: Metadata = {
  title: `${pledge?.title ?? "No premium placement"} — Our Pledge | ${brandConfig.displayName}`,
  description: pledge?.oneSentence,
  alternates: { canonical: `${appBaseUrl()}/pledges/${SLUG}` },
  openGraph: {
    title: `${pledge?.title ?? "No premium placement"} | ${brandConfig.displayName}`,
    description: pledge?.oneSentence,
  },
};

export default function NoPremiumPlacementPledgePage() {
  if (!pledge || pledge.status !== "live") notFound();
  return <PledgeArticle pledge={pledge} />;
}
