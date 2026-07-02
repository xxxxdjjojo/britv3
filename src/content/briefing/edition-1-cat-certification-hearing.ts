import type { BriefingEdition } from "./types";

/**
 * Edition 1 — the Rightmove CAT collective claim, explained for independent
 * agents. All case facts are attributed to public reporting or the claim's
 * own campaign site; the claim is alleged and untested — nothing here asserts
 * wrongdoing as fact.
 */
export const editionOneCatCertificationHearing: BriefingEdition = {
  slug: "edition-1-cat-certification-hearing",
  edition: 1,
  title: "What the Rightmove CAT claim means for independent agents",
  date: "2026-07-02",
  summary:
    "A collective claim against Rightmove is heading for a certification hearing at the Competition Appeal Tribunal this November. Here is what the claim alleges, what certification actually decides, and what independent agents should watch — without the hype.",
  body: [
    {
      heading: "What the claim alleges",
      paragraphs: [
        "In spring 2026, a proposed collective claim against Rightmove was filed at the Competition Appeal Tribunal (CAT) on behalf of UK estate and lettings agents. The proposed class representative is Jeremy Newman, a former Competition and Markets Authority panel member. The claim alleges that Rightmove abused a dominant position in the UK property portal market by charging agents excessive and unfair subscription fees. That is an allegation, not a finding: no tribunal has ruled on it, and Rightmove has publicly called the claim \"without merit\" and said it will defend it vigorously.",
        "According to public reporting, the claim seeks to recover fees paid by agents between April 2020 and April 2026, with reported damages estimated at up to roughly £1.5 billion across the proposed class. The action is reported to be funded by Innsworth, with Scott+Scott UK LLP acting as legal counsel. We have not verified those figures independently, and claimed values at this stage are estimates prepared by the claimant side — treat them as a ceiling argued for certification, not an expected outcome.",
      ],
      sources: [
        {
          label: "The Portal Fees Scandal — the claim's public campaign site",
          url: "https://www.portalfeescandal.co.uk/",
        },
        {
          label:
            "Today's Conveyancer — Rightmove faces £1.5bn class action as agents claim portal has overcharged for services",
          url: "https://todaysconveyancer.co.uk/rightmove-face-1-5bn-class-action-agents-claim-portal-overcharged-services/",
        },
      ],
    },
    {
      heading: "The certification hearing: 2–3 November 2026",
      paragraphs: [
        "Per public listings and trade press reports, the Tribunal is scheduled to hear the application for a Collective Proceedings Order (CPO) on 2 and 3 November 2026. Certification is the gateway stage of a UK collective claim: the Tribunal decides whether the claims raise common issues suitable for collective proceedings and whether the proposed representative should be authorised to bring them on the class's behalf.",
        "It is worth being precise about what certification does and does not mean. If the CPO is granted, the case may proceed towards trial as opt-out collective proceedings — it is not a ruling that Rightmove overcharged anyone, and it says nothing about the eventual outcome. Equally, if certification is refused or narrowed, that is a procedural decision about how the claim may be brought, not a vindication of portal pricing. Collective competition claims routinely take years from certification to judgment or settlement, and some certified claims fail on the merits.",
      ],
      sources: [
        {
          label: "PropertyWire — Rightmove faces £1.5bn court hearing in November",
          url: "https://www.propertywire.com/news/rightmove-faces-1-5bn-court-hearing-in-november/",
        },
      ],
    },
    {
      heading: "What independent agents should watch",
      paragraphs: [
        "First, the class definition and opt-out mechanics. The claim has been reported as an opt-out action, which — if certified — would automatically include eligible UK agents unless they actively opt out. Any formal class notice will come via the Tribunal-approved process, not a marketing email; be sceptical of third parties asking you to \"register\" for a fee.",
        "Second, your own records. If the claim proceeds, the relevant period is reported to run from April 2020 to April 2026. Keeping portal invoices and contracts for that window costs nothing and preserves your options whatever happens.",
        "Third, keep it out of your cash-flow forecast. Whatever the headline number, nothing about this case supports budgeting for a payout: it may not be certified, it may settle for a fraction of the claimed value, and any distribution would likely be years away. The practical takeaway for now is simpler — the economics of portal dependence are getting judicial scrutiny for the first time, and the certification hearing this November is the date that decides whether that scrutiny goes any further.",
      ],
      sources: [
        {
          label:
            "Today's Conveyancer — Date set for £1.5bn Rightmove overcharging claim",
          url: "https://todaysconveyancer.co.uk/date-set-for-1-5bn-rightmove-overcharging-claim/",
        },
      ],
    },
  ],
};
