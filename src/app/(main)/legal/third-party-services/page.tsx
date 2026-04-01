import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const LAST_UPDATED = "1 April 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "overview", label: "1. Overview" },
  { id: "payment-processing", label: "2. Payment Processing" },
  { id: "mapping-services", label: "3. Mapping Services" },
  { id: "analytics", label: "4. Analytics" },
  { id: "error-monitoring", label: "5. Error Monitoring" },
  { id: "ai-services", label: "6. AI Services" },
  { id: "email-services", label: "7. Email Services" },
  { id: "cloud-infrastructure", label: "8. Cloud Infrastructure" },
  { id: "your-rights", label: "9. Your Rights" },
];

export const metadata: Metadata = {
  title: "Third-Party Services Disclosure | Britestate",
  description:
    "Disclosure of third-party services used by Britestate, including payment processing, mapping, analytics, AI, and cloud infrastructure providers.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/third-party-services` },
  openGraph: {
    title: "Third-Party Services Disclosure | Britestate",
    description: "Third-party services and data processors used by Britestate.",
  },
};

export default function ThirdPartyServicesPage() {
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
        <span className="text-foreground">Third-Party Services</span>
      </nav>

      <h1 className="mb-2 font-heading text-2xl font-bold text-foreground">
        Third-Party Services Disclosure
      </h1>
      <p className="mb-4 font-body text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      {/* Amber callout */}
      <div className="mb-8 rounded-xl bg-amber-50 dark:bg-amber-900/20 p-4 ring-1 ring-amber-200/60 dark:ring-amber-700/60 font-body text-sm text-amber-800 dark:text-amber-300">
        Britestate uses carefully selected third-party services to power our platform. This page
        explains what data each service processes and why. For full details on how we protect your
        data, see our{" "}
        <Link href="/legal/privacy" className="underline hover:no-underline">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/legal/data-processing" className="underline hover:no-underline">
          Data Processing Agreement
        </Link>
        .
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <section id="overview">
          <h2 className="font-heading text-lg font-semibold text-foreground">1. Overview</h2>
          <p>
            1.1. Britestate relies on third-party services to deliver a secure, performant, and
            feature-rich platform. Each service is selected for its compliance with applicable data
            protection laws, including the UK GDPR and the Data Protection Act 2018.
          </p>
          <p>
            1.2. We have entered into Data Processing Agreements (DPAs) with each provider where
            they process personal data on our behalf. These agreements ensure that your data is
            handled in accordance with our{" "}
            <Link href="/legal/privacy" className="text-brand-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
          <p>
            1.3. Where data is transferred outside the UK, appropriate safeguards are in place
            (such as Standard Contractual Clauses or adequacy decisions) as described in our{" "}
            <Link href="/legal/data-processing" className="text-brand-primary hover:underline">
              Data Processing Agreement
            </Link>
            .
          </p>
        </section>

        <section id="payment-processing">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            2. Payment Processing
          </h2>
          <p>
            2.1. <strong>Provider:</strong> Stripe, Inc. (Stripe Payments Europe, Ltd for EEA/UK)
          </p>
          <p>
            2.2. <strong>Purpose:</strong> Britestate uses Stripe to process all payments, including
            subscription fees, one-time purchases (listing boosts), and payouts to service providers
            via Stripe Connect. A 2.5% platform commission applies to marketplace transactions.
          </p>
          <p>
            2.3. <strong>Data processed:</strong> Payment card details, billing address, transaction
            amounts, and payout information. Card details are processed directly by Stripe and are
            never stored on Britestate&rsquo;s servers.
          </p>
          <p>
            2.4. <strong>Compliance:</strong> Stripe is PCI DSS Level 1 certified &mdash; the
            highest level of payment security certification. See{" "}
            <a
              href="https://stripe.com/gb/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary hover:underline"
            >
              Stripe&rsquo;s Privacy Policy
            </a>
            .
          </p>
        </section>

        <section id="mapping-services">
          <h2 className="font-heading text-lg font-semibold text-foreground">3. Mapping Services</h2>
          <p>
            3.1. <strong>Providers:</strong> MapTiler AG and MapLibre (open-source)
          </p>
          <p>
            3.2. <strong>Purpose:</strong> Interactive property maps, location search, area
            visualisation, walk scores, and proximity to amenities and transport links.
          </p>
          <p>
            3.3. <strong>Data processed:</strong> Approximate location data based on search queries
            and property coordinates. No personally identifiable information is shared with MapTiler
            beyond IP address (for tile delivery).
          </p>
          <p>
            3.4. <strong>Compliance:</strong> MapTiler processes data under a DPA compliant with UK
            GDPR. MapLibre is a client-side open-source library that does not transmit data to
            external servers. See{" "}
            <a
              href="https://www.maptiler.com/privacy-policy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary hover:underline"
            >
              MapTiler&rsquo;s Privacy Policy
            </a>
            .
          </p>
        </section>

        <section id="analytics">
          <h2 className="font-heading text-lg font-semibold text-foreground">4. Analytics</h2>
          <p>
            4.1. <strong>Provider:</strong> PostHog, Inc.
          </p>
          <p>
            4.2. <strong>Purpose:</strong> Product analytics to understand how users interact with
            our platform, identify usability issues, and improve features. We use PostHog for event
            tracking, session replay (with sensitive fields masked), and feature flags.
          </p>
          <p>
            4.3. <strong>Data processed:</strong> Anonymised usage events, page views, device type,
            browser type, and approximate location (country/region level). Session replays mask all
            form inputs, personal data, and financial information.
          </p>
          <p>
            4.4. <strong>Compliance:</strong> PostHog can be configured for EU/UK data residency.
            We do not use analytics data for advertising. You can opt out of analytics via your
            account privacy settings or our{" "}
            <Link href="/legal/cookies" className="text-brand-primary hover:underline">
              Cookie Policy
            </Link>
            .
          </p>
        </section>

        <section id="error-monitoring">
          <h2 className="font-heading text-lg font-semibold text-foreground">5. Error Monitoring</h2>
          <p>
            5.1. <strong>Provider:</strong> Sentry (Functional Software, Inc.)
          </p>
          <p>
            5.2. <strong>Purpose:</strong> Real-time error tracking and performance monitoring to
            identify and fix bugs quickly, ensuring platform reliability.
          </p>
          <p>
            5.3. <strong>Data processed:</strong> Error stack traces, browser and device metadata,
            and anonymised user identifiers. We configure Sentry to strip personally identifiable
            information from error reports using data scrubbing rules.
          </p>
          <p>
            5.4. <strong>Compliance:</strong> Sentry processes data under a DPA and supports data
            residency in the EU. See{" "}
            <a
              href="https://sentry.io/privacy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary hover:underline"
            >
              Sentry&rsquo;s Privacy Policy
            </a>
            .
          </p>
        </section>

        <section id="ai-services">
          <h2 className="font-heading text-lg font-semibold text-foreground">6. AI Services</h2>
          <p>
            6.1. <strong>Provider:</strong> Anthropic, PBC (Claude AI)
          </p>
          <p>
            6.2. <strong>Purpose:</strong> AI-powered features including property description
            generation, intelligent property matching, natural language search, and AI-assisted
            insights. See our{" "}
            <Link href="/legal/ai-transparency" className="text-brand-primary hover:underline">
              AI Transparency Notice
            </Link>{" "}
            for details on how AI is used on the platform.
          </p>
          <p>
            6.3. <strong>Data processed:</strong> Property details, search queries, and anonymised
            user preferences. Personal data is minimised before being sent to the AI service.
            Anthropic does not use data sent via the API to train its models.
          </p>
          <p>
            6.4. <strong>Compliance:</strong> Anthropic processes data under a DPA. AI-generated
            content is clearly labelled on the platform. See{" "}
            <a
              href="https://www.anthropic.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary hover:underline"
            >
              Anthropic&rsquo;s Privacy Policy
            </a>
            .
          </p>
        </section>

        <section id="email-services">
          <h2 className="font-heading text-lg font-semibold text-foreground">7. Email Services</h2>
          <p>
            7.1. <strong>Provider:</strong> Resend, Inc.
          </p>
          <p>
            7.2. <strong>Purpose:</strong> Transactional email delivery, including account
            verification, password reset, booking confirmations, and notification emails.
          </p>
          <p>
            7.3. <strong>Data processed:</strong> Email addresses, names, and email content. We do
            not use Resend for marketing emails without your explicit consent.
          </p>
          <p>
            7.4. <strong>Compliance:</strong> Resend processes data under a DPA and maintains SOC 2
            Type II certification. See{" "}
            <a
              href="https://resend.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary hover:underline"
            >
              Resend&rsquo;s Privacy Policy
            </a>
            .
          </p>
        </section>

        <section id="cloud-infrastructure">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            8. Cloud Infrastructure
          </h2>
          <p>
            8.1. <strong>Providers:</strong> Supabase, Inc. (database, authentication, real-time,
            storage) and Vercel, Inc. (application hosting and CDN)
          </p>
          <p>
            8.2. <strong>Purpose:</strong> Supabase provides our PostgreSQL database, user
            authentication, real-time messaging infrastructure, and file storage. Vercel hosts our
            application and provides edge caching for fast page delivery worldwide.
          </p>
          <p>
            8.3. <strong>Data processed:</strong> All platform data, including user accounts,
            property listings, messages, documents, and uploaded media. Data is encrypted at rest
            and in transit.
          </p>
          <p>
            8.4. <strong>Compliance:</strong> Both Supabase and Vercel maintain SOC 2 Type II
            certification and process data under DPAs. Database backups are encrypted and retained
            in accordance with our data retention policy.
          </p>
          <p>
            8.5. <strong>Rate limiting:</strong> We use Upstash (Redis) for rate limiting to
            protect the platform from abuse. Upstash processes only anonymised request metadata
            (IP hashes and request counts) and does not store personal data.
          </p>
        </section>

        <section id="your-rights">
          <h2 className="font-heading text-lg font-semibold text-foreground">9. Your Rights</h2>
          <p>
            9.1. You have the right to know which third-party services process your data. This page
            fulfils that transparency obligation under Article 13 of the UK GDPR.
          </p>
          <p>
            9.2. You can exercise your data protection rights (access, rectification, erasure,
            portability, objection) as described in our{" "}
            <Link href="/legal/gdpr-rights" className="text-brand-primary hover:underline">
              GDPR Rights
            </Link>{" "}
            page.
          </p>
          <p>
            9.3. To request information about a specific sub-processor or to raise a concern about
            data processing, contact our Data Protection Officer at{" "}
            <a href="mailto:dpo@britestate.co.uk" className="text-brand-primary hover:underline">
              dpo@britestate.co.uk
            </a>
            .
          </p>
          <p>
            9.4. We will notify you of any material changes to our sub-processors via email or an
            update to this page. The &ldquo;Last updated&rdquo; date at the top of this page
            reflects the most recent change.
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
            name: "Third-Party Services Disclosure",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: "Britestate Ltd" },
            url: `${BASE_URL}/legal/third-party-services`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
