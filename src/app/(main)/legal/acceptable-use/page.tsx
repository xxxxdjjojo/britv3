import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const LAST_UPDATED = "24 March 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "introduction", label: "1. Introduction" },
  { id: "permitted-uses", label: "2. Permitted Uses" },
  { id: "prohibited-conduct", label: "3. Prohibited Conduct" },
  { id: "content-standards", label: "4. Content Standards" },
  { id: "enforcement", label: "5. Enforcement" },
  { id: "reporting-violations", label: "6. Reporting Violations" },
  { id: "appeals", label: "7. Appeals" },
];

export const metadata: Metadata = {
  title: "Acceptable Use Policy | Britestate",
  description:
    "Standards of conduct and prohibited activities on the Britestate platform, informed by the Fraud Act 2006, Computer Misuse Act 1990, Online Safety Act 2023, and Equality Act 2010.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/acceptable-use` },
};

export default function AcceptableUsePage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 font-body text-sm text-neutral-500">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-foreground transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-foreground">Acceptable Use Policy</span>
      </nav>

      <h1 className="mb-2 font-heading text-2xl font-bold text-foreground">Acceptable Use Policy</h1>
      <p className="mb-4 font-body text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mb-8 rounded-xl bg-amber-50 dark:bg-amber-900/20 p-4 ring-1 ring-amber-200/60 dark:ring-amber-700/60 font-body text-sm text-amber-800 dark:text-amber-300">
        This policy supplements our{" "}
        <Link href="/legal/terms" className="underline">Terms of Service</Link>{" "}
        and applies to all Users of the Britestate platform. Violations may result in account suspension or termination.
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <section id="introduction">
          <h2 className="font-heading text-lg font-semibold text-foreground">1. Introduction</h2>
          <p>
            1.1. This Acceptable Use Policy (&ldquo;AUP&rdquo;) supplements the Terms of Service and applies to all
            Users of the Britestate platform. It sets out the standards of conduct we expect and the behaviours we
            prohibit.
          </p>
          <p>
            1.2. This policy is informed by the Fraud Act 2006, the Computer Misuse Act 1990, the Online Safety Act
            2023, the Equality Act 2010, and the Consumer Protection from Unfair Trading Regulations 2008.
          </p>
        </section>

        <section id="permitted-uses">
          <h2 className="font-heading text-lg font-semibold text-foreground">2. Permitted Uses</h2>
          <p>
            2.1. You may use Britestate to: search for and view property listings; list properties for sale or rent
            (where you have lawful authority); contact and communicate with other Users in connection with genuine
            property enquiries; engage estate agents and service providers; leave honest reviews based on genuine
            experience; and access AI-powered property tools and recommendations.
          </p>
        </section>

        <section id="prohibited-conduct">
          <h2 className="font-heading text-lg font-semibold text-foreground">3. Prohibited Conduct</h2>
          <p>You must not:</p>

          <h3 className="text-xl font-semibold font-heading">3.1. Fraudulent and Misleading Activity</h3>
          <ul>
            <li>
              Post fraudulent, fictitious, or phantom listings (listings for properties you do not have authority to
              market);
            </li>
            <li>
              Provide false or misleading information about a property&rsquo;s condition, price, tenure, or
              availability;
            </li>
            <li>
              Manipulate photos, floor plans, or virtual tours to misrepresent a property (including undisclosed
              AI-generated imagery);
            </li>
            <li>
              Engage in gazumping facilitation, gazundering, or other practices intended to unfairly manipulate
              transactions;
            </li>
            <li>Post fake, incentivised, or misleading reviews or ratings.</li>
          </ul>

          <h3 className="text-xl font-semibold font-heading">3.2. Discrimination</h3>
          <ul>
            <li>
              Refuse to sell, let, or provide services to any person on grounds of race, sex, disability, gender
              reassignment, marriage/civil partnership, pregnancy/maternity, religion or belief, sexual orientation,
              or age, contrary to the Equality Act 2010;
            </li>
            <li>
              Include discriminatory criteria in property listings (e.g., &ldquo;no DSS&rdquo;,
              &ldquo;professionals only&rdquo; where used as a proxy for discrimination).
            </li>
          </ul>

          <h3 className="text-xl font-semibold font-heading">3.3. Money Laundering and Financial Crime</h3>
          <ul>
            <li>
              Use the Platform to facilitate money laundering, terrorist financing, sanctions evasion, or tax evasion
              (Proceeds of Crime Act 2002, Terrorism Act 2000, Criminal Finances Act 2017);
            </li>
            <li>Provide false identity documents or source-of-funds information.</li>
          </ul>

          <h3 className="text-xl font-semibold font-heading">3.4. Technical Abuse</h3>
          <ul>
            <li>Scrape, crawl, spider, or data-mine the Platform without our prior written consent;</li>
            <li>
              Attempt to gain unauthorised access to any part of the Platform, other Users&rsquo; accounts, or our
              systems (Computer Misuse Act 1990);
            </li>
            <li>Transmit viruses, malware, or any code designed to disrupt or damage the Platform;</li>
            <li>Use automated tools (bots) to interact with the Platform without authorisation;</li>
            <li>Circumvent rate limits, access controls, or security features.</li>
          </ul>

          <h3 className="text-xl font-semibold font-heading">3.5. Harassment and Harmful Content</h3>
          <ul>
            <li>Harass, threaten, bully, or intimidate other Users;</li>
            <li>Post defamatory, obscene, or illegal content;</li>
            <li>Send spam or unsolicited commercial communications;</li>
            <li>Post content that constitutes a priority offence under the Online Safety Act 2023.</li>
          </ul>

          <h3 className="text-xl font-semibold font-heading">3.6. Intellectual Property</h3>
          <ul>
            <li>
              Upload content that infringes the copyright, trade mark, or other intellectual property rights of any
              third party;
            </li>
            <li>Copy or redistribute listings, photos, or content from the Platform without permission.</li>
          </ul>
        </section>

        <section id="content-standards">
          <h2 className="font-heading text-lg font-semibold text-foreground">4. Content Standards</h2>
          <p>
            4.1. <strong>Listing Accuracy.</strong> All listings must truthfully represent the property. Photos must be
            of the actual property and taken within the past 12 months (or clearly marked as historical). Material
            facts must be disclosed. Floor plans must be to a reasonable scale with a disclaimer that they are for
            illustrative purposes.
          </p>
          <p>
            4.2. <strong>Review Authenticity.</strong> Reviews must reflect genuine personal experience. You must
            disclose any material connection to the subject of your review (e.g., if you are a family member of the
            agent). Businesses must not offer incentives for positive reviews.
          </p>
          <p>
            4.3. <strong>AI-Generated Content.</strong> If you use AI tools to generate listing descriptions or other
            content, you must review the output for accuracy before publishing. Britestate is not responsible for
            inaccuracies in AI-generated content you publish.
          </p>
        </section>

        <section id="enforcement">
          <h2 className="font-heading text-lg font-semibold text-foreground">5. Enforcement</h2>
          <p>
            5.1. We monitor the Platform for breaches of this AUP using a combination of automated tools, user
            reports, and manual review.
          </p>
          <p>5.2. <strong>Consequences.</strong> Depending on the severity and nature of the breach:</p>
          <ul>
            <li>First offence (minor): Warning and content removal;</li>
            <li>Repeated or moderate offence: Temporary account suspension (7&ndash;30 days);</li>
            <li>
              Serious offence (fraud, discrimination, criminal activity): Immediate permanent account termination and
              referral to law enforcement or relevant regulator.
            </li>
          </ul>
          <p>
            5.3. We reserve the right to remove any content and suspend or terminate any account at any time where we
            reasonably believe a breach has occurred, without prior notice where urgency requires.
          </p>
        </section>

        <section id="reporting-violations">
          <h2 className="font-heading text-lg font-semibold text-foreground">6. Reporting Violations</h2>
          <p>
            6.1. If you believe a User has breached this AUP, please report it using the &ldquo;Report&rdquo; button
            on the relevant listing, review, or profile, or email{" "}
            <a href="mailto:compliance@britestate.co.uk">compliance@britestate.co.uk</a>.
          </p>
          <p>
            6.2. We investigate all reports and aim to respond within 5 working days. We will not disclose your
            identity to the reported User without your consent (except where required by law).
          </p>
        </section>

        <section id="appeals">
          <h2 className="font-heading text-lg font-semibold text-foreground">7. Appeals</h2>
          <p>
            7.1. If your account is suspended or content is removed, you may appeal within 14 days by emailing{" "}
            <a href="mailto:compliance@britestate.co.uk">compliance@britestate.co.uk</a> with the subject line
            &ldquo;AUP Appeal &mdash; [Your Account Email].&rdquo;
          </p>
          <p>
            7.2. Appeals are reviewed by a senior team member who was not involved in the original decision. We aim
            to resolve appeals within 10 working days.
          </p>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Acceptable Use Policy",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: "Britestate Ltd" },
            url: `${BASE_URL}/legal/acceptable-use`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
