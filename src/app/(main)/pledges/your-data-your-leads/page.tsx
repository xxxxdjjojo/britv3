import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PledgeArticle } from "@/components/pledges/PledgeArticle";
import { getPledge } from "@/config/pledges";
import { brandConfig, appBaseUrl } from "@/config/brand";

const SLUG = "your-data-your-leads";
const pledge = getPledge(SLUG);

export const metadata: Metadata = {
  title: `${pledge?.title ?? "Your data, your leads"} — Our Pledge | ${brandConfig.displayName}`,
  description: pledge?.oneSentence,
  alternates: { canonical: `${appBaseUrl()}/pledges/${SLUG}` },
  openGraph: {
    title: `${pledge?.title ?? "Your data, your leads"} | ${brandConfig.displayName}`,
    description: pledge?.oneSentence,
  },
};

export default function YourDataYourLeadsPledgePage() {
  if (!pledge || pledge.status !== "live") notFound();
  return <PledgeArticle pledge={pledge} />;
}
