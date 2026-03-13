import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const LAST_UPDATED = "13 March 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "what-are-cookies", label: "1. What Are Cookies" },
  { id: "categories", label: "2. Categories" },
  { id: "cookie-table", label: "3. Cookie Table" },
  { id: "how-to-manage", label: "4. How to Manage" },
  { id: "manage-preferences", label: "5. Manage Preferences" },
];

const COOKIE_TABLE = [
  { name: "sb-*-auth-token", purpose: "Supabase authentication session", duration: "Session / 1 year", type: "Essential" },
  { name: "brite_cookie_consent", purpose: "Stores your cookie consent preferences", duration: "1 year", type: "Essential" },
  { name: "ph_*", purpose: "PostHog analytics — page views and feature usage", duration: "1 year", type: "Analytics" },
  { name: "_ga, _ga_*", purpose: "Google Analytics — aggregate usage statistics", duration: "2 years", type: "Analytics" },
  { name: "_fbp", purpose: "Facebook Pixel — conversion tracking", duration: "3 months", type: "Marketing" },
  { name: "__stripe_mid", purpose: "Stripe fraud prevention", duration: "1 year", type: "Third Party" },
];

export const metadata: Metadata = {
  title: "Cookie Policy | Britestate",
  description: "Details of cookies Britestate uses and how to manage your preferences.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/cookies` },
};

export default function CookiesPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">Cookie Policy</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">Cookie Policy</h1>
      <p className="mb-8 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="what-are-cookies">
          <h2 className="text-2xl font-bold font-heading">1. What Are Cookies</h2>
          <p>
            Cookies are small text files stored on your device when you visit a website. They help the site remember
            your preferences and understand how you use it. {/* TODO: legal review */}
          </p>
        </section>

        <section id="categories">
          <h2 className="text-2xl font-bold font-heading">2. Categories</h2>
          <ul>
            <li><strong>Essential:</strong> Required for authentication and security. Cannot be disabled.</li>
            <li><strong>Analytics:</strong> Help us understand how the platform is used (PostHog, Google Analytics).</li>
            <li><strong>Marketing:</strong> Enable personalised ads and conversion tracking (Facebook Pixel).</li>
            <li><strong>Third Party:</strong> Third-party features such as embedded maps and payment fraud tools.</li>
          </ul>
          {/* TODO: legal review */}
        </section>

        <section id="cookie-table">
          <h2 className="text-2xl font-bold font-heading">3. Cookie Table</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="border border-neutral-200 p-3 text-left font-semibold">Name</th>
                  <th className="border border-neutral-200 p-3 text-left font-semibold">Purpose</th>
                  <th className="border border-neutral-200 p-3 text-left font-semibold">Duration</th>
                  <th className="border border-neutral-200 p-3 text-left font-semibold">Type</th>
                </tr>
              </thead>
              <tbody>
                {COOKIE_TABLE.map((row) => (
                  <tr key={row.name}>
                    <td className="border border-neutral-200 p-3 font-mono text-xs">{row.name}</td>
                    <td className="border border-neutral-200 p-3">{row.purpose}</td>
                    <td className="border border-neutral-200 p-3">{row.duration}</td>
                    <td className="border border-neutral-200 p-3">{row.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="how-to-manage">
          <h2 className="text-2xl font-bold font-heading">4. How to Manage</h2>
          <p>
            You can manage cookies through your browser settings. Most browsers allow you to block or delete cookies.
            Note that disabling essential cookies may affect your ability to use Britestate. {/* TODO: legal review */}
          </p>
        </section>

        <section id="manage-preferences">
          <h2 className="text-2xl font-bold font-heading">5. Manage Preferences</h2>
          <p className="mb-4 text-neutral-600">Use the button below to update your cookie preferences at any time.</p>
          {/* CookiePreferencesInlineButton inserted in Task 10 */}
          <button
            type="button"
            disabled
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
          >
            Manage Cookie Preferences
          </button>
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
