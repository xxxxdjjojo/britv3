import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { CookiePreferencesInlineButton } from "@/components/legal/CookiePreferencesInlineButton";

const LAST_UPDATED = "24 March 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "what-are-cookies", label: "1. What Are Cookies" },
  { id: "categories", label: "2. Categories of Cookies" },
  { id: "cookie-table", label: "3. Cookie Table" },
  { id: "how-to-manage", label: "4. How to Manage Your Preferences" },
  { id: "updates", label: "5. Updates" },
];

const COOKIE_TABLE = [
  {
    name: "sb-*-auth-token",
    provider: "Supabase",
    purpose: "Authentication session",
    duration: "Session / 1 year",
    category: "Strictly Necessary",
  },
  {
    name: "brite_cookie_consent",
    provider: "Britestate",
    purpose: "Stores your cookie consent choices",
    duration: "1 year",
    category: "Strictly Necessary",
  },
  {
    name: "__stripe_mid",
    provider: "Stripe",
    purpose: "Payment fraud prevention",
    duration: "1 year",
    category: "Strictly Necessary",
  },
  {
    name: "__stripe_sid",
    provider: "Stripe",
    purpose: "Payment session",
    duration: "30 minutes",
    category: "Strictly Necessary",
  },
  {
    name: "brite_theme",
    provider: "Britestate",
    purpose: "Dark/light mode preference",
    duration: "1 year",
    category: "Functional",
  },
  {
    name: "brite_search_prefs",
    provider: "Britestate",
    purpose: "Saved search filter defaults",
    duration: "1 year",
    category: "Functional",
  },
  {
    name: "maptiler_session",
    provider: "MapTiler",
    purpose: "Map tile caching",
    duration: "Session",
    category: "Functional",
  },
  {
    name: "sentry-*",
    provider: "Sentry",
    purpose: "Error tracking",
    duration: "Session",
    category: "Functional",
  },
  {
    name: "ph_*",
    provider: "PostHog",
    purpose: "Product analytics and feature usage",
    duration: "1 year",
    category: "Analytics",
  },
  {
    name: "_ga, _ga_*",
    provider: "Google",
    purpose: "Aggregate usage statistics",
    duration: "2 years",
    category: "Analytics",
  },
  {
    name: "_fbp",
    provider: "Facebook",
    purpose: "Conversion tracking (with consent)",
    duration: "3 months",
    category: "Marketing",
  },
];

export const metadata: Metadata = {
  title: "Cookie Policy | Britestate",
  description:
    "Details of cookies Britestate uses and how to manage your preferences. DUAA 2025 compliant.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/cookies` },
};

export default function CookiesPage() {
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
        <span className="text-neutral-900">Cookie Policy</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">Cookie Policy</h1>
      <p className="mb-8 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="what-are-cookies">
          <h2 className="text-2xl font-bold font-heading">1. What Are Cookies</h2>
          <p>
            1.1. Cookies are small text files placed on your device when you visit a website. They
            serve various purposes including remembering your preferences, enabling core
            functionality, and helping us understand how you use the Platform.
          </p>
          <p>
            1.2. We also use similar technologies including local storage, pixel tags, and web
            beacons, which are covered by this policy.
          </p>
          <p>
            1.3. This policy complies with the Privacy and Electronic Communications Regulations
            2003 (PECR) as amended by the Data (Use and Access) Act 2025.
          </p>
        </section>

        <section id="categories">
          <h2 className="text-2xl font-bold font-heading">2. Categories of Cookies</h2>
          <p>
            <strong>2.1. Strictly Necessary Cookies.</strong> These are essential for the Platform
            to function. They enable core features like authentication, security, and cookie consent
            management. They cannot be disabled.
          </p>
          <p>
            <strong>2.2. Functional Cookies.</strong> These remember your preferences (such as
            search filters, dark mode setting, and language preferences) to provide a more
            personalised experience. Under the DUAA 2025, these may be set without opt-in consent
            provided we give you clear information and an opt-out mechanism.
          </p>
          <p>
            <strong>2.3. Analytics Cookies.</strong> These help us understand how users interact
            with the Platform, which pages are most visited, and where errors occur. Under the DUAA
            2025, analytics cookies used purely for statistical purposes may be set on an opt-out
            basis, provided we clearly inform you and offer an easy opt-out. We use PostHog for
            product analytics.
          </p>
          <p>
            <strong>2.4. Marketing Cookies.</strong> These track your activity across websites to
            deliver personalised advertising. We only set marketing cookies with your explicit
            opt-in consent. We use Facebook Pixel for conversion tracking where you have consented.
          </p>
        </section>

        <section id="cookie-table">
          <h2 className="text-2xl font-bold font-heading">3. Cookie Table</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-neutral-200 p-3 text-left font-semibold">
                    Cookie Name
                  </th>
                  <th className="border border-neutral-200 p-3 text-left font-semibold">
                    Provider
                  </th>
                  <th className="border border-neutral-200 p-3 text-left font-semibold">
                    Purpose
                  </th>
                  <th className="border border-neutral-200 p-3 text-left font-semibold">
                    Duration
                  </th>
                  <th className="border border-neutral-200 p-3 text-left font-semibold">
                    Category
                  </th>
                </tr>
              </thead>
              <tbody>
                {COOKIE_TABLE.map((row) => (
                  <tr key={row.name}>
                    <td className="border border-neutral-200 p-3 font-mono text-xs">{row.name}</td>
                    <td className="border border-neutral-200 p-3">{row.provider}</td>
                    <td className="border border-neutral-200 p-3">{row.purpose}</td>
                    <td className="border border-neutral-200 p-3">{row.duration}</td>
                    <td className="border border-neutral-200 p-3">{row.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="how-to-manage">
          <h2 className="text-2xl font-bold font-heading">4. How to Manage Your Preferences</h2>
          <p>
            4.1. <strong>On Britestate:</strong> Click &ldquo;Manage Cookie Preferences&rdquo; in
            the footer or use the button below to open your cookie settings. You can toggle
            Analytics and Marketing cookies on or off at any time.
          </p>
          <p>
            4.2. <strong>In Your Browser:</strong> You can also manage cookies through your browser
            settings:
          </p>
          <ul>
            <li>
              <strong>Chrome:</strong> Settings &gt; Privacy and security &gt; Cookies and other
              site data
            </li>
            <li>
              <strong>Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies and Site
              Data
            </li>
            <li>
              <strong>Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data
            </li>
            <li>
              <strong>Edge:</strong> Settings &gt; Cookies and site permissions &gt; Manage and
              delete cookies
            </li>
          </ul>
          <p>
            4.3. Please note that blocking Strictly Necessary cookies will prevent the Platform
            from functioning properly. Blocking Functional cookies may degrade your experience.
          </p>
          <p>
            4.4. For more information about cookies generally, visit{" "}
            <a
              href="https://www.allaboutcookies.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              allaboutcookies.org
            </a>
            .
          </p>
          <p className="mt-4 mb-2 text-neutral-600">
            Use the button below to update your cookie preferences at any time.
          </p>
          <CookiePreferencesInlineButton />
        </section>

        <section id="updates">
          <h2 className="text-2xl font-bold font-heading">5. Updates</h2>
          <p>
            We update this Cookie Policy when we add or remove cookies. Material changes will be
            communicated via our cookie consent banner. For more information about how we process
            your personal data, see our{" "}
            <Link href="/legal/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Cookie Policy",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: "Britestate Ltd" },
            url: `${BASE_URL}/legal/cookies`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
