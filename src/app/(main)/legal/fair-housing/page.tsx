import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const LAST_UPDATED = "1 April 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "commitment", label: "1. Our Commitment" },
  { id: "protected-characteristics", label: "2. Protected Characteristics" },
  { id: "what-we-prohibit", label: "3. What We Prohibit" },
  { id: "advertising-standards", label: "4. Advertising Standards" },
  { id: "accessibility-in-housing", label: "5. Accessibility in Housing" },
  { id: "reporting-discrimination", label: "6. Reporting Discrimination" },
  { id: "enforcement", label: "7. Enforcement" },
  { id: "legal-framework", label: "8. Legal Framework" },
];

export const metadata: Metadata = {
  title: "Fair Housing Policy | Britestate",
  description:
    "Britestate's commitment to fair housing, equal opportunity, and non-discrimination in property transactions across the UK.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/fair-housing` },
  openGraph: {
    title: "Fair Housing Policy | Britestate",
    description: "Our commitment to fair housing and equal opportunity in property.",
  },
};

export default function FairHousingPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 font-body text-sm text-neutral-500">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-foreground transition-colors">
          Legal
        </Link>
        <span>/</span>
        <span className="text-foreground">Fair Housing Policy</span>
      </nav>

      <h1 className="mb-2 font-heading text-2xl font-bold text-foreground">Fair Housing Policy</h1>
      <p className="mb-4 font-body text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      {/* Emerald callout */}
      <div className="mb-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-4 ring-1 ring-emerald-200/60 dark:ring-emerald-700/60 font-body text-sm text-emerald-800 dark:text-emerald-300">
        Britestate is committed to providing equal access to housing for everyone. We do not
        tolerate discrimination based on any protected characteristic. If you experience or witness
        discrimination on our platform, please{" "}
        <Link href="/legal/complaints" className="underline hover:no-underline">
          report it immediately
        </Link>
        .
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <section id="commitment">
          <h2 className="font-heading text-lg font-semibold text-foreground">1. Our Commitment</h2>
          <p>
            1.1. Britestate Ltd (&ldquo;Britestate&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is
            committed to promoting equality of opportunity in housing. Every person searching for,
            renting, buying, selling, or letting property through our platform deserves to be treated
            fairly and with dignity.
          </p>
          <p>
            1.2. This policy applies to all users of the Britestate platform, including homebuyers,
            renters, sellers, landlords, estate agents, and service providers.
          </p>
          <p>
            1.3. We actively work to ensure that our platform, algorithms, and services do not
            create or reinforce discriminatory outcomes in housing.
          </p>
        </section>

        <section id="protected-characteristics">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            2. Protected Characteristics
          </h2>
          <p>
            2.1. Under the Equality Act 2010, it is unlawful to discriminate against any person based
            on the following protected characteristics:
          </p>
          <ul>
            <li>Age</li>
            <li>Disability</li>
            <li>Gender reassignment</li>
            <li>Marriage and civil partnership</li>
            <li>Pregnancy and maternity</li>
            <li>Race (including colour, nationality, ethnic or national origin)</li>
            <li>Religion or belief (including lack of belief)</li>
            <li>Sex</li>
            <li>Sexual orientation</li>
          </ul>
          <p>
            2.2. Britestate extends this protection beyond the statutory minimum. We also prohibit
            discrimination based on housing benefit or Universal Credit receipt status, source of
            income, immigration status (where the person has a legal right to rent), or family
            composition.
          </p>
        </section>

        <section id="what-we-prohibit">
          <h2 className="font-heading text-lg font-semibold text-foreground">3. What We Prohibit</h2>
          <p>
            3.1. The following conduct is prohibited on the Britestate platform:
          </p>
          <ul>
            <li>
              <strong>Direct discrimination</strong> &mdash; treating someone less favourably because
              of a protected characteristic (e.g., refusing to let a property to a family with
              children).
            </li>
            <li>
              <strong>Indirect discrimination</strong> &mdash; applying a provision, criterion, or
              practice that puts people with a protected characteristic at a disadvantage (e.g.,
              blanket &ldquo;No DSS&rdquo; policies).
            </li>
            <li>
              <strong>Harassment</strong> &mdash; unwanted conduct related to a protected
              characteristic that has the purpose or effect of creating a hostile environment.
            </li>
            <li>
              <strong>Victimisation</strong> &mdash; treating someone unfavourably because they have
              made or supported a complaint about discrimination.
            </li>
          </ul>
          <p>
            3.2. Landlords and agents must not include discriminatory criteria in listing
            descriptions, tenant requirements, or communications through our messaging system.
          </p>
        </section>

        <section id="advertising-standards">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            4. Advertising Standards
          </h2>
          <p>
            4.1. All property listings on Britestate must comply with the Equality Act 2010, the
            Advertising Standards Authority (ASA) CAP Code, and the Property Ombudsman Code of
            Practice.
          </p>
          <p>
            4.2. Listings must not contain language that excludes or discourages applications from
            persons with protected characteristics. This includes phrases such as &ldquo;no
            children&rdquo;, &ldquo;professionals only&rdquo; (when used to exclude certain groups),
            &ldquo;no DSS&rdquo;, or &ldquo;English speakers only&rdquo;.
          </p>
          <p>
            4.3. Britestate uses automated screening to flag potentially discriminatory language in
            listings. Flagged listings will be reviewed by our moderation team before publication.
          </p>
          <p>
            4.4. Photographs and virtual tours must not be selectively edited to misrepresent the
            demographic composition of a neighbourhood.
          </p>
        </section>

        <section id="accessibility-in-housing">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            5. Accessibility in Housing
          </h2>
          <p>
            5.1. Landlords have a duty under the Equality Act 2010 to make reasonable adjustments
            for disabled tenants. This may include allowing modifications to the property, providing
            information in accessible formats, or adjusting policies.
          </p>
          <p>
            5.2. Britestate encourages all landlords and agents to include accessibility information
            in their listings, such as step-free access, lift availability, door widths, and
            proximity to accessible transport links.
          </p>
          <p>
            5.3. Our platform supports accessibility filters to help users find properties that
            meet their needs. See our{" "}
            <Link href="/legal/accessibility" className="text-brand-primary hover:underline">
              Accessibility Statement
            </Link>{" "}
            for details on platform accessibility.
          </p>
        </section>

        <section id="reporting-discrimination">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            6. Reporting Discrimination
          </h2>
          <p>
            6.1. If you experience or witness discrimination on the Britestate platform, you can
            report it through:
          </p>
          <ul>
            <li>
              Our in-platform reporting tool (available on every listing and in messages)
            </li>
            <li>
              Email: <a href="mailto:fairhousing@britestate.co.uk" className="text-brand-primary hover:underline">fairhousing@britestate.co.uk</a>
            </li>
            <li>
              Our{" "}
              <Link href="/legal/complaints" className="text-brand-primary hover:underline">
                formal complaints procedure
              </Link>
            </li>
          </ul>
          <p>
            6.2. All reports are investigated promptly and confidentially. We will not disclose your
            identity to the person you are reporting without your consent, unless required by law.
          </p>
          <p>
            6.3. You will not be penalised or disadvantaged for making a good-faith report of
            discrimination.
          </p>
        </section>

        <section id="enforcement">
          <h2 className="font-heading text-lg font-semibold text-foreground">7. Enforcement</h2>
          <p>
            7.1. Where we find that a user has engaged in discriminatory conduct, we may take the
            following actions:
          </p>
          <ul>
            <li>Issuing a formal warning</li>
            <li>Removing discriminatory content from listings or messages</li>
            <li>Suspending the user&rsquo;s account pending investigation</li>
            <li>Permanently terminating the user&rsquo;s account</li>
            <li>Reporting the matter to the Equality and Human Rights Commission (EHRC) or other relevant authority</li>
          </ul>
          <p>
            7.2. Repeated or serious violations will result in permanent account termination. Our{" "}
            <Link href="/legal/terms" className="text-brand-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/legal/acceptable-use" className="text-brand-primary hover:underline">
              Acceptable Use Policy
            </Link>{" "}
            provide further detail on account enforcement.
          </p>
        </section>

        <section id="legal-framework">
          <h2 className="font-heading text-lg font-semibold text-foreground">8. Legal Framework</h2>
          <p>
            8.1. This policy is underpinned by the following UK legislation:
          </p>
          <ul>
            <li>Equality Act 2010</li>
            <li>Human Rights Act 1998</li>
            <li>Tenant Fees Act 2019</li>
            <li>Housing Act 1988 (as amended)</li>
            <li>Landlord and Tenant Act 1985</li>
          </ul>
          <p>
            8.2. Where there is a conflict between this policy and applicable law, the law prevails.
          </p>
          <p>
            8.3. For further information about your rights, you can contact the{" "}
            <a
              href="https://www.equalityhumanrights.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary hover:underline"
            >
              Equality and Human Rights Commission
            </a>{" "}
            or{" "}
            <a
              href="https://www.citizensadvice.org.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary hover:underline"
            >
              Citizens Advice
            </a>
            .
          </p>
        </section>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Fair Housing Policy",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: "Britestate Ltd" },
            url: `${BASE_URL}/legal/fair-housing`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
