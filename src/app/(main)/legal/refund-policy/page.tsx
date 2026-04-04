import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const LAST_UPDATED = "1 April 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "scope", label: "1. Scope" },
  { id: "subscription-refunds", label: "2. Subscription Refunds" },
  { id: "one-time-purchases", label: "3. One-Time Purchase Refunds" },
  { id: "cancellation-rights", label: "4. Cancellation Rights" },
  { id: "how-to-request", label: "5. How to Request a Refund" },
  { id: "processing-timeframes", label: "6. Processing Timeframes" },
  { id: "exceptions", label: "7. Exceptions & Non-Refundable Items" },
  { id: "contact", label: "8. Contact" },
];

export const metadata: Metadata = {
  title: "Refund Policy | Britestate",
  description:
    "Refund policy for Britestate subscriptions, listing boosts, and one-time purchases, including your cancellation rights under UK consumer law.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/refund-policy` },
  openGraph: {
    title: "Refund Policy | Britestate",
    description: "Refund and cancellation policy for Britestate paid services.",
  },
};

export default function RefundPolicyPage() {
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
        <span className="text-foreground">Refund Policy</span>
      </nav>

      <h1 className="mb-2 font-heading text-2xl font-bold text-foreground">Refund Policy</h1>
      <p className="mb-4 font-body text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      {/* Rose callout */}
      <div className="mb-8 rounded-xl bg-error-light dark:bg-error/20 p-4 ring-1 ring-error/30 dark:ring-error/30 font-body text-sm text-error dark:text-error">
        You have a 14-day cooling-off period for most online purchases under UK consumer law. If
        you&rsquo;re not satisfied with a paid service, contact us at{" "}
        <a href="mailto:billing@britestate.co.uk" className="underline hover:no-underline">
          billing@britestate.co.uk
        </a>{" "}
        and we&rsquo;ll do our best to help.
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <section id="scope">
          <h2 className="font-heading text-lg font-semibold text-foreground">1. Scope</h2>
          <p>
            1.1. This Refund Policy applies to all paid services purchased through the Britestate
            platform, including subscription plans, listing boosts, featured placements, and any
            other one-time purchases.
          </p>
          <p>
            1.2. This policy applies to payments made directly to Britestate Ltd. Payments made to
            third parties through the platform (e.g., service provider fees via Stripe Connect) are
            subject to the refund terms of the relevant service provider.
          </p>
          <p>
            1.3. This policy should be read alongside our{" "}
            <Link href="/legal/terms" className="text-brand-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/legal/fee-transparency" className="text-brand-primary hover:underline">
              Fee Transparency
            </Link>{" "}
            page.
          </p>
        </section>

        <section id="subscription-refunds">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            2. Subscription Refunds
          </h2>
          <p>
            2.1. Monthly and annual subscription plans can be cancelled at any time from your
            account settings. Cancellation takes effect at the end of your current billing period
            &mdash; you will continue to have access to paid features until then.
          </p>
          <p>
            2.2. If you cancel within the first 14 days of a new subscription (or within 14 days
            of an annual renewal), you are entitled to a full refund under the Consumer Contracts
            (Information, Cancellation and Additional Charges) Regulations 2013.
          </p>
          <p>
            2.3. After the 14-day cooling-off period, subscription fees already paid are
            non-refundable. However, we may offer a pro-rata refund at our discretion if:
          </p>
          <ul>
            <li>
              There has been a significant service outage or platform failure affecting your ability
              to use paid features
            </li>
            <li>
              We have made a material change to the service that substantially reduces its value
            </li>
            <li>
              You were charged in error (e.g., duplicate payment or incorrect amount)
            </li>
          </ul>
          <p>
            2.4. Downgrading from a higher-tier plan to a lower-tier plan does not entitle you to
            a refund for the difference. The lower-tier pricing applies from the next billing cycle.
          </p>
        </section>

        <section id="one-time-purchases">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            3. One-Time Purchase Refunds
          </h2>
          <p>
            3.1. One-time purchases include listing boosts, featured placements, premium listing
            upgrades, and any other non-recurring paid features.
          </p>
          <p>
            3.2. Listing boosts and featured placements can be refunded in full if the refund is
            requested before the boost or placement has been activated (i.e., before the listing
            has appeared in promoted positions).
          </p>
          <p>
            3.3. Once a boost or featured placement is active, refunds are available on a pro-rata
            basis for the unused portion, provided the request is made within 14 days of purchase.
          </p>
          <p>
            3.4. If a boost or featured placement did not deliver as described (e.g., the listing
            was not displayed in promoted positions due to a platform error), you are entitled to
            a full refund regardless of timing.
          </p>
        </section>

        <section id="cancellation-rights">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            4. Cancellation Rights
          </h2>
          <p>
            4.1. Under the Consumer Contracts (Information, Cancellation and Additional Charges)
            Regulations 2013, you have the right to cancel most online purchases within 14 days of
            the date of purchase (the &ldquo;cooling-off period&rdquo;), without giving a reason.
          </p>
          <p>
            4.2. To exercise your cancellation right, you must notify us of your decision by a
            clear statement. You can use our online cancellation form in your account settings, or
            contact us at{" "}
            <a href="mailto:billing@britestate.co.uk" className="text-brand-primary hover:underline">
              billing@britestate.co.uk
            </a>
            .
          </p>
          <p>
            4.3. The cancellation period expires 14 days after the day on which the contract was
            concluded (for services) or 14 days after the day on which you receive the goods (for
            physical items, if applicable).
          </p>
          <p>
            4.4. If you have requested that services begin during the cooling-off period (e.g.,
            by activating a listing boost immediately), you may still cancel within 14 days, but
            we may deduct a proportionate amount for the service already provided.
          </p>
          <p>
            4.5. Nothing in this policy affects your statutory rights under the Consumer Rights
            Act 2015.
          </p>
        </section>

        <section id="how-to-request">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            5. How to Request a Refund
          </h2>
          <p>
            5.1. You can request a refund through any of the following channels:
          </p>
          <ul>
            <li>
              <strong>Account settings:</strong> Navigate to Settings &gt; Billing &gt; Transaction
              History and select &ldquo;Request Refund&rdquo; next to the relevant transaction
            </li>
            <li>
              <strong>Email:</strong>{" "}
              <a href="mailto:billing@britestate.co.uk" className="text-brand-primary hover:underline">
                billing@britestate.co.uk
              </a>
            </li>
            <li>
              <strong>Post:</strong> Britestate Ltd, [Registered Address], United Kingdom
            </li>
          </ul>
          <p>
            5.2. When requesting a refund, please include:
          </p>
          <ul>
            <li>Your account email address</li>
            <li>The transaction reference or invoice number</li>
            <li>The date of purchase</li>
            <li>The reason for your refund request</li>
          </ul>
          <p>
            5.3. We will acknowledge your refund request within 2 business days.
          </p>
        </section>

        <section id="processing-timeframes">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            6. Processing Timeframes
          </h2>
          <p>
            6.1. Once a refund is approved, we will process it within 14 days using the same
            payment method used for the original purchase.
          </p>
          <p>
            6.2. Typical processing times by payment method:
          </p>
          <ul>
            <li><strong>Debit card:</strong> 5&ndash;10 business days</li>
            <li><strong>Credit card:</strong> 5&ndash;10 business days</li>
            <li><strong>Bank transfer:</strong> 3&ndash;5 business days</li>
          </ul>
          <p>
            6.3. If you have not received your refund within the timeframes above, please check
            with your bank or card issuer before contacting us, as processing times can vary.
          </p>
        </section>

        <section id="exceptions">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            7. Exceptions & Non-Refundable Items
          </h2>
          <p>
            7.1. The following are not eligible for refunds:
          </p>
          <ul>
            <li>
              Subscription fees after the 14-day cooling-off period (unless at our discretion per
              Section 2.3)
            </li>
            <li>
              Listing boosts or featured placements that have been fully consumed (i.e., the
              promotion period has ended)
            </li>
            <li>
              Services where performance has been fully completed with your prior express consent
              and acknowledgement that you would lose your cancellation right
            </li>
            <li>
              Fees charged by third-party service providers (these are governed by the
              provider&rsquo;s own refund terms)
            </li>
            <li>
              Accounts terminated for breach of our{" "}
              <Link href="/legal/terms" className="text-brand-primary hover:underline">
                Terms of Service
              </Link>{" "}
              or{" "}
              <Link href="/legal/acceptable-use" className="text-brand-primary hover:underline">
                Acceptable Use Policy
              </Link>
            </li>
          </ul>
          <p>
            7.2. If a refund is denied, we will explain the reason in writing. You may escalate
            the matter through our{" "}
            <Link href="/legal/complaints" className="text-brand-primary hover:underline">
              complaints procedure
            </Link>
            .
          </p>
        </section>

        <section id="contact">
          <h2 className="font-heading text-lg font-semibold text-foreground">8. Contact</h2>
          <p>
            8.1. For billing and refund enquiries:
          </p>
          <ul>
            <li>
              Email:{" "}
              <a href="mailto:billing@britestate.co.uk" className="text-brand-primary hover:underline">
                billing@britestate.co.uk
              </a>
            </li>
            <li>
              General support:{" "}
              <a href="mailto:support@britestate.co.uk" className="text-brand-primary hover:underline">
                support@britestate.co.uk
              </a>
            </li>
          </ul>
          <p>
            8.2. If you are dissatisfied with the outcome of a refund request, you can raise a
            formal complaint through our{" "}
            <Link href="/legal/complaints" className="text-brand-primary hover:underline">
              complaints procedure
            </Link>{" "}
            or contact{" "}
            <a
              href="https://www.citizensadvice.org.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary hover:underline"
            >
              Citizens Advice
            </a>{" "}
            for independent guidance on your consumer rights.
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
            name: "Refund Policy",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: "Britestate Ltd" },
            url: `${BASE_URL}/legal/refund-policy`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
