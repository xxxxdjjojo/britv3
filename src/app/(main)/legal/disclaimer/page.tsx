import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const LAST_UPDATED = "13 March 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "no-advice", label: "1. No Professional Advice" },
  { id: "accuracy", label: "2. Accuracy of Information" },
  { id: "third-party-links", label: "3. Third-Party Links" },
  { id: "intermediary", label: "4. Platform as Intermediary" },
  { id: "liability", label: "5. Limitation of Liability" },
  { id: "jurisdiction", label: "6. Jurisdiction" },
];

export const metadata: Metadata = {
  title: "Disclaimer | Britestate",
  description: "Limitations on the advice and information Britestate provides.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/disclaimer` },
  openGraph: { title: "Disclaimer | Britestate", description: "Britestate disclaimer." },
};

export default function DisclaimerPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">Disclaimer</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">Disclaimer</h1>
      <p className="mb-8 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="no-advice">
          <h2 className="text-2xl font-bold font-heading">1. No Professional Advice</h2>
          <p>
            Nothing on the Britestate platform constitutes legal, financial, mortgage, surveying, or investment advice.
            You should consult qualified professionals before making any property-related decisions. {/* TODO: legal review */}
          </p>
        </section>

        <section id="accuracy">
          <h2 className="text-2xl font-bold font-heading">2. Accuracy of Information</h2>
          <p>
            Property listings, valuations, and market data on Britestate are provided by third parties. While we
            make reasonable efforts to ensure accuracy, we do not guarantee the completeness or correctness of any
            information on the platform. {/* TODO: legal review */}
          </p>
        </section>

        <section id="third-party-links">
          <h2 className="text-2xl font-bold font-heading">3. Third-Party Links</h2>
          <p>
            Britestate may contain links to third-party websites. We are not responsible for the content, accuracy,
            or practices of those websites. Linking does not constitute endorsement. {/* TODO: legal review */}
          </p>
        </section>

        <section id="intermediary">
          <h2 className="text-2xl font-bold font-heading">4. Platform as Intermediary</h2>
          <p>
            Britestate acts as an intermediary platform facilitating connections between buyers, sellers, landlords,
            tenants, agents, and service providers. We are not a party to any transaction conducted through the
            platform. {/* TODO: legal review */}
          </p>
        </section>

        <section id="liability">
          <h2 className="text-2xl font-bold font-heading">5. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, Britestate Ltd excludes all liability for losses
            arising from your use of the platform, including reliance on information provided by third parties.
            Nothing in this disclaimer limits liability for fraud, death, or personal injury caused by negligence. {/* TODO: legal review */}
          </p>
        </section>

        <section id="jurisdiction">
          <h2 className="text-2xl font-bold font-heading">6. Jurisdiction</h2>
          <p>
            This disclaimer is governed by the laws of England and Wales. Any disputes shall be subject to the
            exclusive jurisdiction of the courts of England and Wales. {/* TODO: legal review */}
          </p>
        </section>
      </div>

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
