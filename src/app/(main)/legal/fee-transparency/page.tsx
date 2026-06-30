import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { brandConfig, appBaseUrl } from "@/config/brand";

const LAST_UPDATED = "24 March 2026";
const BASE_URL = appBaseUrl();

const SECTIONS = [
  { id: "commitment", label: "1. Our Commitment to Transparency" },
  { id: "homebuyers-renters", label: "2. For Homebuyers and Renters" },
  { id: "sellers", label: "3. For Sellers" },
  { id: "landlords", label: "4. For Landlords" },
  { id: "estate-agents", label: "5. For Estate Agents" },
  { id: "service-providers", label: "6. For Service Providers" },
  { id: "payment-processing", label: "7. Payment Processing" },
  { id: "changes-to-fees", label: "8. Changes to Fees" },
];

export const metadata: Metadata = {
  title: `Fee Transparency | ${brandConfig.displayName}`,
  description: `Clear breakdown of ${brandConfig.displayName} platform fees, commissions, and payment terms for all user types.`,
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/fee-transparency` },
  openGraph: {
    title: `Fee Transparency | ${brandConfig.displayName}`,
    description: "Clear breakdown of platform fees, commissions, and payment terms.",
  },
};

export default function FeeTransparencyPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">Fee Transparency</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">Fee Transparency</h1>
      <p className="mb-4 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      {/* Yellow info callout */}
      <div className="mb-8 bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-lg p-4 text-sm">
        {brandConfig.displayName} Ltd believes in clear, upfront pricing with no hidden fees. This page sets out all
        fees associated with using the Platform, in accordance with CMA guidance on fee transparency.
      </div>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="commitment">
          <h2 className="text-2xl font-bold font-heading">1. Our Commitment to Transparency</h2>
          <p>
            {brandConfig.displayName} Ltd believes in clear, upfront pricing with no hidden fees. This page sets out
            all fees associated with using the Platform, in accordance with CMA guidance on fee
            transparency.
          </p>
        </section>

        <section id="homebuyers-renters">
          <h2 className="text-2xl font-bold font-heading">2. For Homebuyers and Renters</h2>
          <p>
            Searching for properties, setting alerts, saving favourites, and contacting agents is
            free. There are no fees for homebuyers or renters using the Platform.
          </p>
        </section>

        <section id="sellers">
          <h2 className="text-2xl font-bold font-heading">3. For Sellers</h2>
          <p>
            Listing your property through an estate agent on {brandConfig.displayName} is covered by your agreement
            with the agent. {brandConfig.displayName} does not charge sellers directly.
          </p>
          <p>
            If you use {brandConfig.displayName}&apos;s direct listing service (where available), fees are displayed
            at the point of listing and must be confirmed before your listing goes live.
          </p>
        </section>

        <section id="landlords">
          <h2 className="text-2xl font-bold font-heading">4. For Landlords</h2>
          <p>
            Listing rental properties is [free / part of a subscription &mdash; specify]. Landlords
            are responsible for any fees charged by their managing agent, which are separate from
            {brandConfig.displayName}&apos;s fees.
          </p>
        </section>

        <section id="estate-agents">
          <h2 className="text-2xl font-bold font-heading">5. For Estate Agents</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-neutral-200 px-4 py-2 text-left font-semibold">Plan</th>
                  <th className="border border-neutral-200 px-4 py-2 text-left font-semibold">Monthly Fee (excl. VAT)</th>
                  <th className="border border-neutral-200 px-4 py-2 text-left font-semibold">Listings Included</th>
                  <th className="border border-neutral-200 px-4 py-2 text-left font-semibold">Premium Features</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-neutral-200 px-4 py-2">Starter</td>
                  <td className="border border-neutral-200 px-4 py-2">&pound;[X]</td>
                  <td className="border border-neutral-200 px-4 py-2">Up to [X]</td>
                  <td className="border border-neutral-200 px-4 py-2">Basic analytics</td>
                </tr>
                <tr className="bg-muted">
                  <td className="border border-neutral-200 px-4 py-2">Professional</td>
                  <td className="border border-neutral-200 px-4 py-2">&pound;[X]</td>
                  <td className="border border-neutral-200 px-4 py-2">Up to [X]</td>
                  <td className="border border-neutral-200 px-4 py-2">Advanced analytics, priority support</td>
                </tr>
                <tr>
                  <td className="border border-neutral-200 px-4 py-2">Enterprise</td>
                  <td className="border border-neutral-200 px-4 py-2">Custom</td>
                  <td className="border border-neutral-200 px-4 py-2">Unlimited</td>
                  <td className="border border-neutral-200 px-4 py-2">API access, dedicated account manager</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4">
            Fees are payable monthly or annually in advance. Annual billing provides a [X]% discount.
            All fees are subject to VAT at the prevailing rate.
          </p>
          <p>
            <strong>Platform Commission:</strong> A commission of 2.5% applies to transactions
            facilitated through the Platform&apos;s referral or lead generation features. This is
            clearly displayed before any transaction is confirmed and is deducted automatically via
            Stripe Connect.
          </p>
          <p>
            <strong>Cancellation:</strong> You may cancel your subscription at any time. If you cancel
            within the first 14 days (cooling-off period under the Consumer Contracts Regulations
            2013), you are entitled to a full refund less any proportionate usage. After 14 days, your
            subscription remains active until the end of the current billing period.
          </p>
        </section>

        <section id="service-providers">
          <h2 className="text-2xl font-bold font-heading">6. For Service Providers</h2>
          <p>
            Service providers (surveyors, conveyancers, mortgage brokers, tradespeople) may list their
            services on the {brandConfig.displayName} marketplace. Listing fees and commission rates are displayed on
            the marketplace registration page and confirmed before sign-up.
          </p>
        </section>

        <section id="payment-processing">
          <h2 className="text-2xl font-bold font-heading">7. Payment Processing</h2>
          <p>
            All payments are processed securely by Stripe. {brandConfig.displayName} does not store your card
            details. Stripe&apos;s fees are included in the prices shown and are not charged
            separately to you.
          </p>
        </section>

        <section id="changes-to-fees">
          <h2 className="text-2xl font-bold font-heading">8. Changes to Fees</h2>
          <p>
            We will provide at least 30 days&apos; written notice before changing any fees. Price
            increases do not apply to prepaid annual subscriptions until renewal.
          </p>
          <p>
            If you have questions about fees, contact us at{" "}
            <a href={`mailto:${brandConfig.emails.support}`}>{brandConfig.emails.support}</a> or see our{" "}
            <Link href="/legal/complaints" className="text-primary underline">
              Complaints Procedure
            </Link>{" "}
            if you believe you have been charged incorrectly.
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
            name: "Fee Transparency",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: `${brandConfig.displayName} Ltd` },
            url: `${BASE_URL}/legal/fee-transparency`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
