import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { brandConfig, appBaseUrl } from "@/config/brand";

const LAST_UPDATED = "24 March 2026";
const BASE_URL = appBaseUrl();

const SECTIONS = [
  { id: "introduction", label: "1. Introduction" },
  { id: "data-we-collect", label: "2. Data We Collect" },
  { id: "legal-basis", label: "3. Legal Basis for Processing" },
  { id: "how-we-use", label: "4. How We Use Your Data" },
  { id: "data-sharing", label: "5. Data Sharing" },
  { id: "data-retention", label: "6. Data Retention" },
  { id: "international-transfers", label: "7. International Transfers" },
  { id: "automated-decisions", label: "8. Automated Decision-Making and Profiling" },
  { id: "your-rights", label: "9. Your Rights" },
  { id: "cookies", label: "10. Cookies" },
  { id: "childrens-data", label: "11. Children's Data" },
  { id: "data-security", label: "12. Data Security" },
  { id: "changes", label: "13. Changes to This Policy" },
  { id: "dpo-contact", label: "14. Contact" },
];

export const metadata: Metadata = {
  title: `Privacy Policy | ${brandConfig.displayName}`,
  description:
    `How ${brandConfig.displayName} Ltd collects, uses, shares, and protects your personal data under UK GDPR, the Data Protection Act 2018, and the Data (Use and Access) Act 2025.`,
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/privacy` },
  openGraph: { title: `Privacy Policy | ${brandConfig.displayName}`, description: `${brandConfig.displayName} Privacy Policy.` },
};

export default function PrivacyPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">
          Legal
        </Link>
        <span>/</span>
        <span className="text-neutral-900">Privacy Policy</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">Privacy Policy</h1>
      <p className="mb-4 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mb-8 bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-lg p-4 text-sm">
        This policy explains how {brandConfig.displayName} Ltd processes your personal data in compliance with UK
        GDPR, the Data Protection Act 2018, and the Data (Use and Access) Act 2025. To exercise
        your data rights, visit our{" "}
        <Link href="/legal/gdpr-rights" className="underline hover:no-underline">
          GDPR Rights page
        </Link>
        .
      </div>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="introduction">
          <h2 className="text-2xl font-bold font-heading">1. Introduction</h2>
          <p>
            1.1. {brandConfig.displayName} Ltd (&ldquo;{brandConfig.displayName}&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is
            the data controller for the personal data processed through the {brandConfig.canonicalDomain}
            platform (the &ldquo;Platform&rdquo;). We are registered with the Information
            Commissioner&rsquo;s Office (ICO) under registration number [ICO REGISTRATION NUMBER].
          </p>
          <p>
            1.2. This Privacy Policy explains how we collect, use, share, and protect your personal
            data in compliance with the UK General Data Protection Regulation (UK GDPR), the Data
            Protection Act 2018, and the Data (Use and Access) Act 2025.
          </p>
          <p>
            1.3. Our Data Protection Officer can be contacted at{" "}
            <a href={`mailto:${brandConfig.emails.privacy}`}>{brandConfig.emails.privacy}</a> or by post at
            [REGISTERED ADDRESS].
          </p>
        </section>

        <section id="data-we-collect">
          <h2 className="text-2xl font-bold font-heading">2. Data We Collect</h2>
          <p>We collect the following categories of personal data:</p>
          <p>
            <strong>2.1. Account Data:</strong> Name, email address, phone number, password
            (hashed), profile photo, user role (homebuyer, renter, seller, landlord, estate agent,
            service provider).
          </p>
          <p>
            <strong>2.2. Identity Verification Data</strong> (agents, landlords, service
            providers): Government-issued ID, proof of address, professional qualifications,
            company registration details, redress scheme membership.
          </p>
          <p>
            <strong>2.3. Property Data:</strong> Listing details, property photos, EPC data, floor
            plans, property documents uploaded by you.
          </p>
          <p>
            <strong>2.4. Transaction Data:</strong> Payment amounts, commission records,
            subscription history, invoices. Card details are processed by Stripe and not stored by
            us.
          </p>
          <p>
            <strong>2.5. Search and Browsing Data:</strong> Property search queries, saved
            searches, saved properties, viewing history, alert preferences.
          </p>
          <p>
            <strong>2.6. Communication Data:</strong> Messages sent through the Platform, enquiry
            forms, support tickets.
          </p>
          <p>
            <strong>2.7. Technical Data:</strong> IP address, browser type and version, device
            type, operating system, referring URL, pages visited, session duration.
          </p>
          <p>
            <strong>2.8. AI Interaction Data:</strong> Property recommendations viewed, feedback on
            recommendations, search preference signals used by our AI matching system.
          </p>
          <p>
            <strong>2.9. AML/KYC Data:</strong> Where required by the Money Laundering Regulations
            2017: source of funds declarations, PEP screening results, sanctions screening results.
          </p>
        </section>

        <section id="legal-basis">
          <h2 className="text-2xl font-bold font-heading">3. Legal Basis for Processing</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-neutral-200 p-3 text-left font-semibold">
                    Processing Activity
                  </th>
                  <th className="border border-neutral-200 p-3 text-left font-semibold">
                    Lawful Basis (UK GDPR Art. 6)
                  </th>
                  <th className="border border-neutral-200 p-3 text-left font-semibold">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "Account creation and management",
                    "Contract (Art. 6(1)(b))",
                    "Necessary to provide the service you signed up for",
                  ],
                  [
                    "Property search, listings, and alerts",
                    "Contract (Art. 6(1)(b))",
                    "Core platform functionality",
                  ],
                  [
                    "Payment processing via Stripe",
                    "Contract (Art. 6(1)(b))",
                    "Necessary to process transactions",
                  ],
                  [
                    "Identity verification (agents, landlords)",
                    "Legal obligation (Art. 6(1)(c))",
                    "Required by MLR 2017 and Estate Agents Act 1979",
                  ],
                  [
                    "AML/KYC checks",
                    "Legal obligation (Art. 6(1)(c))",
                    "Required by MLR 2017 and POCA 2002",
                  ],
                  [
                    "AI-powered property recommendations",
                    "Legitimate interests (Art. 6(1)(f))",
                    "To personalise your experience (balanced against your right to opt out)",
                  ],
                  [
                    "Platform analytics and improvement",
                    "Legitimate interests (Art. 6(1)(f))",
                    "To improve platform performance and user experience",
                  ],
                  [
                    "Marketing emails (opted in)",
                    "Consent (Art. 6(1)(a))",
                    "Only with your explicit opt-in; withdraw at any time",
                  ],
                  [
                    "Marketing to existing customers (soft opt-in)",
                    "Legitimate interests (Art. 6(1)(f))",
                    "PECR soft opt-in for similar services; opt-out in every email",
                  ],
                  [
                    "Fraud prevention and platform security",
                    "Legitimate interests (Art. 6(1)(f))",
                    "To protect users and maintain platform integrity",
                  ],
                  [
                    "Responding to legal requests",
                    "Legal obligation (Art. 6(1)(c))",
                    "Where required by court order or statutory obligation",
                  ],
                  [
                    "Tax record retention",
                    "Legal obligation (Art. 6(1)(c))",
                    "HMRC requirements",
                  ],
                ].map(([activity, basis, detail]) => (
                  <tr key={activity}>
                    <td className="border border-neutral-200 p-3">{activity}</td>
                    <td className="border border-neutral-200 p-3">{basis}</td>
                    <td className="border border-neutral-200 p-3">{detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4">
            <strong>Special Category Data:</strong> We do not intentionally collect special
            category data (e.g., racial origin, health data). If you voluntarily include such data
            in communications, we process it on the basis of your explicit consent (Art. 9(2)(a)).
          </p>
        </section>

        <section id="how-we-use">
          <h2 className="text-2xl font-bold font-heading">4. How We Use Your Data</h2>
          <p>
            4.1. To operate and maintain the Platform, including account management, listing
            display, search functionality, and communication features.
          </p>
          <p>
            4.2. To personalise your experience through AI-powered property recommendations and
            search matching. You can opt out of personalisation in your privacy settings.
          </p>
          <p>4.3. To process payments and commissions through Stripe Connect.</p>
          <p>4.4. To verify identities and comply with anti-money laundering regulations.</p>
          <p>
            4.5. To send transactional communications (booking confirmations, account updates,
            security alerts).
          </p>
          <p>
            4.6. To send marketing communications where you have opted in or where soft opt-in
            applies.
          </p>
          <p>4.7. To detect and prevent fraud, spam, and abuse.</p>
          <p>4.8. To analyse platform usage and improve our services.</p>
          <p>4.9. To comply with legal and regulatory obligations.</p>
        </section>

        <section id="data-sharing">
          <h2 className="text-2xl font-bold font-heading">5. Data Sharing</h2>
          <p>We share your data with the following categories of recipients:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-neutral-200 p-3 text-left font-semibold">
                    Recipient
                  </th>
                  <th className="border border-neutral-200 p-3 text-left font-semibold">
                    Purpose
                  </th>
                  <th className="border border-neutral-200 p-3 text-left font-semibold">
                    Location
                  </th>
                  <th className="border border-neutral-200 p-3 text-left font-semibold">
                    Transfer Mechanism
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Supabase (database hosting)", "Platform infrastructure", "EU (Frankfurt)", "UK adequacy decision"],
                  ["Stripe", "Payment processing", "USA", "UK-approved SCCs"],
                  ["Anthropic", "AI features (property matching, recommendations)", "USA", "UK-approved SCCs + DPA"],
                  ["Resend", "Transactional and marketing email", "USA", "UK-approved SCCs"],
                  ["PostHog", "Product analytics", "EU", "UK adequacy decision"],
                  ["Sentry", "Error tracking and monitoring", "USA", "UK-approved SCCs"],
                  ["MapTiler", "Map display and geocoding", "EU", "UK adequacy decision"],
                  ["Upstash", "Rate limiting (Redis)", "EU", "UK adequacy decision"],
                  ["Vercel", "Hosting and CDN", "Global (edge)", "UK-approved SCCs"],
                ].map(([recipient, purpose, location, mechanism]) => (
                  <tr key={recipient}>
                    <td className="border border-neutral-200 p-3 font-medium">{recipient}</td>
                    <td className="border border-neutral-200 p-3">{purpose}</td>
                    <td className="border border-neutral-200 p-3">{location}</td>
                    <td className="border border-neutral-200 p-3">{mechanism}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4">
            We do not sell your personal data to third parties. We may share data with law
            enforcement or regulators where required by law.
          </p>
          <p>
            When you contact an estate agent, landlord, or service provider through the Platform,
            your contact details are shared with that User to facilitate the enquiry. This is
            necessary for the performance of our contract with you.
          </p>
        </section>

        <section id="data-retention">
          <h2 className="text-2xl font-bold font-heading">6. Data Retention</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-neutral-200 p-3 text-left font-semibold">
                    Data Type
                  </th>
                  <th className="border border-neutral-200 p-3 text-left font-semibold">
                    Retention Period
                  </th>
                  <th className="border border-neutral-200 p-3 text-left font-semibold">
                    Basis
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "Active account data",
                    "Duration of account + 30-day deletion grace period",
                    "Contract performance",
                  ],
                  [
                    "Closed account (basic record)",
                    "6 years from closure",
                    "Limitation Act 1980 (6-year limitation period)",
                  ],
                  [
                    "Transaction and payment records",
                    "7 years from transaction",
                    "HMRC tax record requirements",
                  ],
                  [
                    "AML/KYC records",
                    "5 years from end of business relationship",
                    "MLR 2017, Reg. 40",
                  ],
                  [
                    "Communication records",
                    "2 years from last message",
                    "Legitimate interest (dispute resolution)",
                  ],
                  ["Analytics data", "26 months (aggregated)", "Legitimate interest"],
                  [
                    "Marketing consent records",
                    "Duration of consent + 2 years",
                    "PECR compliance evidence",
                  ],
                  [
                    "SAR/GDPR request records",
                    "3 years",
                    "ICO accountability principle",
                  ],
                ].map(([type, period, basis]) => (
                  <tr key={type}>
                    <td className="border border-neutral-200 p-3">{type}</td>
                    <td className="border border-neutral-200 p-3">{period}</td>
                    <td className="border border-neutral-200 p-3">{basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="international-transfers">
          <h2 className="text-2xl font-bold font-heading">7. International Transfers</h2>
          <p>
            7.1. Some of our sub-processors operate outside the United Kingdom. Where data is
            transferred outside the UK, we ensure appropriate safeguards are in place.
          </p>
          <p>
            7.2. For transfers to countries with a UK adequacy decision (including the EU/EEA), no
            additional safeguards are required.
          </p>
          <p>
            7.3. For transfers to other countries (including the USA), we rely on UK International
            Data Transfer Agreements (IDTAs) or UK-approved Standard Contractual Clauses (SCCs),
            supplemented by a transfer impact assessment where appropriate.
          </p>
          <p>
            7.4. You may request a copy of the relevant transfer safeguards by contacting{" "}
            <a href={`mailto:${brandConfig.emails.privacy}`}>{brandConfig.emails.privacy}</a>.
          </p>
        </section>

        <section id="automated-decisions">
          <h2 className="text-2xl font-bold font-heading">
            8. Automated Decision-Making and Profiling
          </h2>
          <p>
            8.1. Our AI-powered property recommendation system uses your search history, saved
            properties, and stated preferences to generate personalised property suggestions. This
            constitutes profiling under UK GDPR.
          </p>
          <p>
            8.2. No decisions with legal or similarly significant effects are made solely by
            automated means without human oversight.
          </p>
          <p>
            8.3. You have the right to: (a) opt out of profiling for recommendation purposes in
            your privacy settings; (b) request human review of any AI-generated output that
            significantly affects you; (c) receive meaningful information about the logic involved
            in our AI systems. See our{" "}
            <Link href="/legal/ai-transparency" className="text-primary underline">
              AI Transparency Notice
            </Link>
            .
          </p>
        </section>

        <section id="your-rights">
          <h2 className="text-2xl font-bold font-heading">9. Your Rights</h2>
          <p>Under UK GDPR, you have the following rights:</p>
          <p>
            <strong>9.1. Right of Access (Art. 15):</strong> You may request a copy of all
            personal data we hold about you.
          </p>
          <p>
            <strong>9.2. Right to Rectification (Art. 16):</strong> You may request correction of
            inaccurate or incomplete data.
          </p>
          <p>
            <strong>9.3. Right to Erasure (Art. 17):</strong> You may request deletion of your
            data, subject to our legal retention obligations.
          </p>
          <p>
            <strong>9.4. Right to Restrict Processing (Art. 18):</strong> You may request
            restriction of processing while a dispute is resolved.
          </p>
          <p>
            <strong>9.5. Right to Data Portability (Art. 20):</strong> You may request your data
            in a structured, machine-readable format (JSON).
          </p>
          <p>
            <strong>9.6. Right to Object (Art. 21):</strong> You may object to processing based on
            legitimate interests, including profiling for AI recommendations. We will cease
            processing unless we have compelling legitimate grounds.
          </p>
          <p>
            <strong>9.7. Rights Related to Automated Decision-Making (Art. 22):</strong> You may
            request human intervention in any solely automated decision that significantly affects
            you.
          </p>
          <p>
            <strong>9.8. Right to Withdraw Consent:</strong> Where processing is based on consent,
            you may withdraw consent at any time without affecting the lawfulness of prior
            processing.
          </p>
          <p>
            To exercise any right, use our{" "}
            <Link href="/legal/gdpr-rights" className="text-primary underline">
              GDPR Rights page
            </Link>
            , or email{" "}
            <a href={`mailto:${brandConfig.emails.privacy}`}>{brandConfig.emails.privacy}</a>. We will
            respond within 30 days. We may request identity verification before processing your
            request. If we cannot action your request, we will explain why.
          </p>
          <p>
            <strong>9.9. Right to Complain:</strong> You have the right to lodge a complaint with
            the ICO at{" "}
            <a
              href="https://ico.org.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              ico.org.uk
            </a>{" "}
            or by calling 0303 123 1113.
          </p>
        </section>

        <section id="cookies">
          <h2 className="text-2xl font-bold font-heading">10. Cookies</h2>
          <p>
            We use cookies and similar technologies. Please see our{" "}
            <Link href="/legal/cookies" className="text-primary underline">
              Cookie Policy
            </Link>{" "}
            for full details, including how to manage your preferences.
          </p>
        </section>

        <section id="childrens-data">
          <h2 className="text-2xl font-bold font-heading">11. Children&rsquo;s Data</h2>
          <p>
            The Platform is not directed at children under 18. We do not knowingly collect personal
            data from children. If we become aware that we have collected data from a child under
            18, we will delete it promptly.
          </p>
        </section>

        <section id="data-security">
          <h2 className="text-2xl font-bold font-heading">12. Data Security</h2>
          <p>
            12.1. We implement appropriate technical and organisational measures to protect your
            data, including encryption in transit (TLS 1.3) and at rest (AES-256), role-based
            access controls, regular security testing, and incident response procedures.
          </p>
          <p>
            12.2. In the event of a personal data breach that is likely to result in a risk to your
            rights, we will notify the ICO within 72 hours and notify affected individuals without
            undue delay where there is a high risk.
          </p>
        </section>

        <section id="changes">
          <h2 className="text-2xl font-bold font-heading">13. Changes to This Policy</h2>
          <p>
            We will notify you of material changes to this policy by email or in-app notification
            at least 30 days before they take effect. The &ldquo;last updated&rdquo; date at the
            top of this page indicates the most recent revision.
          </p>
        </section>

        <section id="dpo-contact">
          <h2 className="text-2xl font-bold font-heading">14. Contact</h2>
          <p>
            Data Protection Officer:{" "}
            <a href={`mailto:${brandConfig.emails.privacy}`}>{brandConfig.emails.privacy}</a>
            <br />
            {brandConfig.displayName} Ltd, [REGISTERED ADDRESS]
            <br />
            Company No. [COMPANY NUMBER]
            <br />
            ICO Registration: [ICO REGISTRATION NUMBER]
          </p>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Privacy Policy",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: `${brandConfig.displayName} Ltd` },
            url: `${BASE_URL}/legal/privacy`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
