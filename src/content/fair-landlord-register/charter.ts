/**
 * Fair Landlord Register — charter content (Influence Strategy 3.4).
 *
 * This is a pledge, not a vetting service. TrueDeed performs no legal
 * due-diligence on signatories; landlords self-attest to these commitments.
 * The register is a public statement of intent, not a certification scheme.
 */

export type PledgeItem = Readonly<{
  id: string;
  heading: string;
  body: string;
}>;

/**
 * VERBATIM CONTRACT: the string "a pledge, not a vetting service" must appear
 * in this file (asserted by phase3-surfaces.test.ts).
 *
 * This register is a pledge, not a vetting service. Signing does not imply
 * endorsement, accreditation, or legal certification by TrueDeed.
 */
export const FAIR_LANDLORD_DISCLAIMER =
  "This register is a pledge, not a vetting service. Signing does not imply " +
  "endorsement, accreditation, or legal certification by TrueDeed.";

export const PLEDGE_ITEMS: readonly PledgeItem[] = [
  {
    id: "legal-compliance",
    heading: "I comply with current letting law",
    body: "I keep my property safe, provide the required documentation (EPC, Gas Safety Certificate, How to Rent guide), and protect deposits in a government-approved scheme.",
  },
  {
    id: "fair-notice",
    heading: "I give reasonable notice before entering",
    body: "Except in emergencies, I give at least 24 hours' notice before entering the property and arrange visits at mutually convenient times.",
  },
  {
    id: "prompt-repairs",
    heading: "I respond to repair requests promptly",
    body: "I acknowledge repair requests within 48 hours and carry out urgent repairs within a reasonable timeframe, keeping tenants informed throughout.",
  },
  {
    id: "transparent-fees",
    heading: "I charge only permitted fees",
    body: "I do not charge any fees prohibited under the Tenant Fees Act 2019 and keep all permitted charges fair, transparent, and itemised.",
  },
  {
    id: "no-retaliatory-eviction",
    heading: "I do not use retaliatory eviction",
    body: "I will not seek to evict a tenant in response to a legitimate complaint about the property's condition or the tenancy.",
  },
  {
    id: "fair-deposit-return",
    heading: "I return deposits fairly and on time",
    body: "At the end of the tenancy I return the deposit promptly, providing a clear written breakdown of any deductions with supporting evidence.",
  },
  {
    id: "renters-rights-act",
    heading: "I understand and follow the Renters' Rights Act 2025",
    body: "I keep up with the phased commencement of the Renters' Rights Act 2025 and update my practices as each provision takes effect.",
  },
];

/** Short one-liner used in page meta and social previews. */
export const CHARTER_SUMMARY =
  "Landlords who publicly commit to fair practice — repairs, deposits, notice, and no retaliatory eviction. " +
  FAIR_LANDLORD_DISCLAIMER;
