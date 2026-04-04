import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const LAST_UPDATED = "24 March 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "no-professional-advice", label: "1. No Professional Advice" },
  { id: "accuracy-of-listings", label: "2. Accuracy of Listings and Third-Party Content" },
  { id: "valuations-and-market-data", label: "3. Valuations and Market Data" },
  { id: "epc-and-energy-data", label: "4. EPC and Energy Data" },
  { id: "ai-generated-content", label: "5. AI-Generated Content" },
  { id: "maps-and-location-data", label: "6. Maps and Location Data" },
  { id: "third-party-links", label: "7. Third-Party Links" },
  { id: "intermediary-status", label: "8. Platform Intermediary Status" },
  { id: "liability", label: "9. Limitation of Liability" },
  { id: "governing-law", label: "10. Governing Law" },
];

export const metadata: Metadata = {
  title: "Disclaimer | Britestate",
  description:
    "Important information on the limitations of advice and information provided on Britestate, covering listings, valuations, AI content, maps, and platform intermediary status.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/disclaimer` },
  openGraph: {
    title: "Disclaimer | Britestate",
    description: "Limitations on advice and information provided by Britestate.",
  },
};

export default function DisclaimerPage() {
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
        <span className="text-foreground">Disclaimer</span>
      </nav>

      <h1 className="mb-2 font-heading text-2xl font-bold text-foreground">Disclaimer</h1>
      <p className="mb-4 font-body text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      {/* Yellow info callout */}
      <div className="mb-8 rounded-xl bg-warning-light dark:bg-warning/10 p-4 ring-1 ring-warning/30 dark:ring-warning/40 font-body text-sm text-warning dark:text-warning">
        Nothing on Britestate constitutes professional advice. Always consult a qualified
        professional before making property-related decisions. See our{" "}
        <Link href="/legal/terms" className="underline hover:no-underline">
          Terms of Service
        </Link>{" "}
        for full liability provisions.
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <section id="no-professional-advice">
          <h2 className="font-heading text-lg font-semibold text-foreground">1. No Professional Advice</h2>
          <p>
            1.1. Nothing on the Britestate platform constitutes legal, financial, mortgage,
            surveying, investment, tax, or valuation advice. All content is provided for general
            informational purposes only.
          </p>
          <p>
            1.2. You should always consult a qualified, regulated professional before making any
            property-related decisions, including: a solicitor or licensed conveyancer for legal
            matters; a mortgage broker or financial adviser authorised by the FCA for financial
            matters; and a RICS-qualified surveyor for property condition assessments.
          </p>
        </section>

        <section id="accuracy-of-listings">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            2. Accuracy of Listings and Third-Party Content
          </h2>
          <p>
            2.1. Property listings, descriptions, photographs, floor plans, and virtual tours are
            provided by third parties (estate agents, landlords, sellers). Britestate does not
            independently verify this content and does not guarantee its accuracy, completeness, or
            currency.
          </p>
          <p>
            2.2. It is your responsibility to verify all information (including price, tenure,
            condition, measurements, and planning status) before making any property-related
            decision.
          </p>
        </section>

        <section id="valuations-and-market-data">
          <h2 className="font-heading text-lg font-semibold text-foreground">3. Valuations and Market Data</h2>
          <p>
            3.1. Any property valuations, price estimates, or market data displayed on the platform
            (including AI-generated estimates) are based on publicly available data and algorithmic
            modelling. They are approximate indicators only and should not be relied upon as formal
            valuations.
          </p>
          <p>
            3.2. For a formal property valuation, you should instruct a RICS-registered valuer.
          </p>
        </section>

        <section id="epc-and-energy-data">
          <h2 className="font-heading text-lg font-semibold text-foreground">4. EPC and Energy Data</h2>
          <p>
            4.1. Energy Performance Certificate (EPC) data is sourced from the government&rsquo;s
            EPC register. While we endeavour to display current data, EPCs have a 10-year validity
            period and may not reflect recent improvements to a property.
          </p>
        </section>

        <section id="ai-generated-content">
          <h2 className="font-heading text-lg font-semibold text-foreground">5. AI-Generated Content</h2>
          <p>
            5.1. Certain features on Britestate use artificial intelligence to generate property
            descriptions, recommendations, and insights. AI-generated content may contain
            inaccuracies or omissions. It is labelled as AI-generated and should be treated as a
            starting point, not a definitive source. See our{" "}
            <Link href="/legal/ai-transparency" className="text-brand-primary hover:underline">
              AI Transparency Notice
            </Link>{" "}
            for further detail.
          </p>
        </section>

        <section id="maps-and-location-data">
          <h2 className="font-heading text-lg font-semibold text-foreground">6. Maps and Location Data</h2>
          <p>
            6.1. Maps and location information are provided by MapTiler and MapLibre GL JS. Map pin
            locations are approximate and may not reflect the exact position of a property. Walk
            scores, transport links, and local amenities are based on third-party data and may not
            be fully current or accurate.
          </p>
        </section>

        <section id="third-party-links">
          <h2 className="font-heading text-lg font-semibold text-foreground">7. Third-Party Links</h2>
          <p>
            7.1. The platform may contain links to third-party websites and services. Britestate is
            not responsible for the content, privacy practices, or availability of those sites.
            Inclusion of a link does not constitute endorsement.
          </p>
        </section>

        <section id="intermediary-status">
          <h2 className="font-heading text-lg font-semibold text-foreground">8. Platform Intermediary Status</h2>
          <p>
            8.1. Britestate acts as a technology platform intermediary. We facilitate connections
            between buyers, sellers, landlords, tenants, estate agents, and service providers, but
            we are not a party to any transaction.
          </p>
          <p>
            8.2. We do not act as an estate agent, letting agent, surveyor, solicitor, mortgage
            broker, or any other regulated professional. Where our users are regulated
            professionals, their regulatory obligations remain their own responsibility.
          </p>
        </section>

        <section id="liability">
          <h2 className="font-heading text-lg font-semibold text-foreground">9. Limitation of Liability</h2>
          <p>
            9.1. To the maximum extent permitted by applicable law, Britestate Ltd excludes all
            liability for any loss or damage arising from your use of the platform or your reliance
            on information provided by third parties through the platform.
          </p>
          <p>
            9.2. Nothing in this disclaimer excludes or limits our liability for: death or personal
            injury caused by our negligence; fraud or fraudulent misrepresentation; or any liability
            that cannot be excluded under the Consumer Rights Act 2015 or other applicable law.
          </p>
        </section>

        <section id="governing-law">
          <h2 className="font-heading text-lg font-semibold text-foreground">10. Governing Law</h2>
          <p>
            10.1. This disclaimer is governed by the laws of England and Wales. The courts of
            England and Wales have exclusive jurisdiction, subject to the consumer jurisdiction
            rights described in our{" "}
            <Link href="/legal/terms" className="text-brand-primary hover:underline">
              Terms of Service
            </Link>
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
            name: "Disclaimer",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: "Britestate Ltd" },
            url: `${BASE_URL}/legal/disclaimer`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
