import type { Metadata } from "next";
import { CalculatorPageHeader } from "@/components/calculators/CalculatorPageHeader";
import { CategoryPageFAQ } from "@/components/seo/CategoryPageFAQ";
import { ContentVersionStamp } from "@/components/trust/ContentVersionStamp";
import { NotLegalAdviceBanner } from "@/components/trust/NotLegalAdviceBanner";
import { RentersRightsChecker } from "@/components/tools/renters-rights/RentersRightsChecker";
import { RENTERS_RIGHTS_TREES } from "@/content/renters-rights";
import type { FAQItem } from "@/lib/providers/seo-utils";

export const metadata: Metadata = {
  title: "Renters' Rights Checker | TrueDeed",
  description:
    "Free Renters' Rights Act 2025 checker for England. Answer a few questions to see where you stand on Section 21, rent rises, advance rent, bidding and deposits — with cited legal grounds.",
};

const FAQS: FAQItem[] = [
  {
    question: "Is Section 21 still in force?",
    answer:
      "No. Section 21 'no-fault' evictions were abolished for tenancies in England on 1 May 2026 by the Renters' Rights Act 2025. Under the transitional rules, a Section 21 notice served before 1 May 2026 can only be used if the landlord's possession claim reaches court by 31 July 2026 — after that it lapses. Landlords now need a specified ground under Section 8 of the Housing Act 1988 (as amended) to end a tenancy.",
  },
  {
    question: "How often can my rent be increased?",
    answer:
      "Under the reformed rules, rent on a periodic assured tenancy can be increased at most once every 12 months, and only using the formal Section 13 notice procedure with the required notice period. Tenants can challenge a proposed increase at the First-tier Tribunal (Property Chamber) before it takes effect, and the tribunal cannot set the rent higher than the landlord proposed.",
  },
  {
    question: "Can a landlord ask for six months' rent in advance?",
    answer:
      "No. Under the Renters' Rights Act 2025 (as currently in force), landlords and agents cannot require more than one month's rent in advance for a new tenancy. A tenancy deposit (within the existing cap) can still be taken.",
  },
  {
    question: "Are rental bidding wars banned?",
    answer:
      "Yes. Properties must be advertised at a fixed asking rent, and landlords and letting agents cannot invite, encourage or accept offers above the advertised rent. Local councils can take enforcement action against breaches.",
  },
  {
    question: "Do fixed-term tenancies still exist in England?",
    answer:
      "The Renters' Rights Act 2025 moved England to a single system of periodic tenancies that roll month to month. Existing assured shorthold tenancies converted to the new system on 1 May 2026. Tenants can leave by giving the required notice; landlords need a specified legal ground to seek possession.",
  },
  {
    question: "Does the Renters' Rights Act 2025 apply outside England?",
    answer:
      "No. The Act applies to England. Scotland, Wales and Northern Ireland each have their own separate rented-sector laws, so this checker only covers tenancies in England.",
  },
];

export default function RentersRightsCheckerPage() {
  const tree = RENTERS_RIGHTS_TREES.tenant;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <CalculatorPageHeader
        title="Renters' Rights Checker"
        description="Answer a few quick questions to see where you stand under the Renters' Rights Act 2025 — with the legal grounds cited for every answer."
      />

      <div className="mb-8">
        <NotLegalAdviceBanner variant="rights" />
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8 dark:border-neutral-800 dark:bg-neutral-900">
        <RentersRightsChecker />
      </div>

      <CategoryPageFAQ faqs={FAQS} category="renting" location="England" />

      <footer className="mt-10 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <ContentVersionStamp checkedDate={tree.checkedDate} version={tree.version} />
      </footer>
    </main>
  );
}
