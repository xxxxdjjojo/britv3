import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Britestate",
  description:
    "Learn how Britestate collects, uses, and protects your personal data in compliance with GDPR.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <h1 className="font-heading text-4xl font-bold text-neutral-900">
        Privacy Policy
      </h1>
      <p className="mt-4 text-sm text-neutral-500">
        Last updated: March 2026
      </p>
      <p className="mt-2 rounded-lg border border-warning bg-warning-light px-4 py-3 text-sm text-neutral-700">
        This is placeholder privacy policy text. Final policy will be reviewed
        by legal counsel and a data protection officer before launch.
      </p>

      <div className="mt-10 space-y-10 text-neutral-600">
        <section>
          <h2 className="font-heading text-xl font-semibold text-neutral-900">
            1. Data Controller
          </h2>
          <p className="mt-3 text-base leading-relaxed">
            Britestate Ltd is the data controller responsible for your personal
            data. For any data protection queries, contact us at
            privacy@britestate.co.uk.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-neutral-900">
            2. Data We Collect
          </h2>
          <p className="mt-3 text-base leading-relaxed">
            We collect the following categories of personal data:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base">
            <li>Account information: name, email address, phone number</li>
            <li>
              Profile data: role preferences, saved searches, property interests
            </li>
            <li>
              Transaction data: offer details, document uploads, communication
              logs
            </li>
            <li>
              Technical data: IP address, browser type, device information,
              cookies
            </li>
            <li>Usage data: pages visited, features used, search queries</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-neutral-900">
            3. How We Use Your Data
          </h2>
          <p className="mt-3 text-base leading-relaxed">
            We use your personal data for the following purposes:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base">
            <li>Providing and improving our property portal services</li>
            <li>Facilitating property transactions and communications</li>
            <li>Verifying user identities and preventing fraud</li>
            <li>Sending service-related notifications</li>
            <li>
              Marketing communications (only with your explicit consent)
            </li>
            <li>Analytics to improve platform performance</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-neutral-900">
            4. Legal Basis for Processing
          </h2>
          <p className="mt-3 text-base leading-relaxed">
            We process your data under the following legal bases as defined by
            the UK GDPR: contractual necessity, legitimate interests, legal
            obligations, and your explicit consent where applicable.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-neutral-900">
            5. Data Sharing
          </h2>
          <p className="mt-3 text-base leading-relaxed">
            We may share your data with: estate agents you contact through the
            platform, service providers you engage, payment processors (Stripe),
            and analytics services. We will never sell your personal data to
            third parties.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-neutral-900">
            6. Your Rights Under GDPR
          </h2>
          <p className="mt-3 text-base leading-relaxed">
            Under the UK GDPR, you have the following rights:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-base">
            <li>
              <strong>Right of access</strong> -- request a copy of your
              personal data
            </li>
            <li>
              <strong>Right to rectification</strong> -- correct inaccurate data
            </li>
            <li>
              <strong>Right to erasure</strong> -- request deletion of your data
            </li>
            <li>
              <strong>Right to restrict processing</strong> -- limit how we use
              your data
            </li>
            <li>
              <strong>Right to data portability</strong> -- receive your data in
              a portable format
            </li>
            <li>
              <strong>Right to object</strong> -- object to processing based on
              legitimate interests
            </li>
            <li>
              <strong>Right to withdraw consent</strong> -- withdraw consent at
              any time
            </li>
          </ul>
          <p className="mt-3 text-base leading-relaxed">
            To exercise any of these rights, contact us at
            privacy@britestate.co.uk. We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-neutral-900">
            7. Data Retention
          </h2>
          <p className="mt-3 text-base leading-relaxed">
            We retain your personal data only for as long as necessary to
            provide our services and fulfil the purposes outlined in this
            policy. Account data is deleted within 30 days of account closure,
            unless retention is required by law.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold text-neutral-900">
            8. Contact
          </h2>
          <p className="mt-3 text-base leading-relaxed">
            For privacy-related queries, contact our Data Protection Officer at
            privacy@britestate.co.uk. You also have the right to lodge a
            complaint with the Information Commissioner&apos;s Office (ICO).
          </p>
        </section>
      </div>
    </div>
  );
}
