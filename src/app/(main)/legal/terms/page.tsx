import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const LAST_UPDATED = "13 March 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "introduction", label: "1. Introduction" },
  { id: "user-accounts", label: "2. User Accounts" },
  { id: "acceptable-use", label: "3. Acceptable Use" },
  { id: "intellectual-property", label: "4. Intellectual Property" },
  { id: "disclaimers", label: "5. Disclaimers" },
  { id: "liability", label: "6. Limitation of Liability" },
  { id: "governing-law", label: "7. Governing Law" },
  { id: "changes", label: "8. Changes to Terms" },
];

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms and conditions governing your use of the Britestate platform.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/terms` },
  openGraph: { title: "Terms of Service", description: "Terms and conditions for Britestate." },
};

export default function TermsPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">Terms of Service</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">Terms of Service</h1>
      <p className="mb-4 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      {/* Yellow info callout */}
      <div className="mb-8 bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-lg p-4 text-sm">
        {/* TODO: legal review */}
        Please read these terms carefully before using Britestate. By accessing or using our platform,
        you agree to be bound by these terms.
      </div>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="introduction">
          <h2 className="text-2xl font-bold font-heading">1. Introduction</h2>
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the Britestate platform
            operated by Britestate Ltd (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;),
            a company registered in England and Wales (Company No. 12345678).
            {/* TODO: legal review */}
          </p>
        </section>

        <section id="user-accounts">
          <h2 className="text-2xl font-bold font-heading">2. User Accounts</h2>
          <p>
            You must provide accurate information when creating an account. You are responsible for
            maintaining the confidentiality of your account credentials. Notify us immediately at{" "}
            <a href="mailto:support@britestate.co.uk">support@britestate.co.uk</a> if you suspect
            unauthorised access. {/* TODO: legal review */}
          </p>
        </section>

        <section id="acceptable-use">
          <h2 className="text-2xl font-bold font-heading">3. Acceptable Use</h2>
          <p>
            You agree not to use Britestate for unlawful purposes, to post fraudulent listings, to
            impersonate others, or to scrape our platform without written permission. Full details are
            in our{" "}
            <Link href="/legal/acceptable-use" className="text-primary hover:underline">
              Acceptable Use Policy
            </Link>
            . {/* TODO: legal review */}
          </p>
        </section>

        <section id="intellectual-property">
          <h2 className="text-2xl font-bold font-heading">4. Intellectual Property</h2>
          <p>
            All content on Britestate — including logos, text, and software — is owned by or licensed
            to Britestate Ltd and protected by copyright, database rights, and other intellectual
            property laws. {/* TODO: legal review */}
          </p>
        </section>

        <section id="disclaimers">
          <h2 className="text-2xl font-bold font-heading">5. Disclaimers</h2>
          <p>
            Britestate is a platform intermediary. We do not provide legal, financial, surveying, or
            mortgage advice. Listings and valuations are provided by third parties. See our{" "}
            <Link href="/legal/disclaimer" className="text-primary hover:underline">
              Disclaimer
            </Link>{" "}
            for full details. {/* TODO: legal review */}
          </p>
        </section>

        <section id="liability">
          <h2 className="text-2xl font-bold font-heading">6. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Britestate Ltd is not liable for indirect,
            incidental, or consequential damages arising from your use of the platform. Our aggregate
            liability shall not exceed the fees paid by you in the preceding 12 months. Nothing in
            these Terms limits liability for fraud, death, or personal injury caused by our
            negligence. {/* TODO: legal review */}
          </p>
        </section>

        <section id="governing-law">
          <h2 className="text-2xl font-bold font-heading">7. Governing Law</h2>
          <p>
            These Terms are governed by the laws of England and Wales. Any disputes shall be subject
            to the exclusive jurisdiction of the courts of England and Wales. {/* TODO: legal review */}
          </p>
        </section>

        <section id="changes">
          <h2 className="text-2xl font-bold font-heading">8. Changes to Terms</h2>
          <p>
            We may update these Terms at any time. We will notify you by email or in-app notification
            at least 14 days before material changes take effect. Continued use of Britestate after
            that date constitutes acceptance. {/* TODO: legal review */}
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
            name: "Terms of Service",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: "Britestate Ltd" },
            url: `${BASE_URL}/legal/terms`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
