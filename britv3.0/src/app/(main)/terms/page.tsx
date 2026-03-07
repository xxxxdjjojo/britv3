import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Britestate",
  description: "Britestate terms of service and conditions of use.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <h1 className="font-heading text-4xl font-bold text-neutral-900">
        Terms of Service
      </h1>
      <p className="mt-4 text-sm text-neutral-500">
        Last updated: March 2026
      </p>
      <p className="mt-2 rounded-lg border border-warning bg-warning-light px-4 py-3 text-sm text-neutral-700">
        This is placeholder legal text and does not constitute binding terms.
        Final terms will be reviewed by legal counsel before launch.
      </p>

      <div className="prose mt-10 max-w-none text-neutral-600">
        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-neutral-900">
            1. Acceptance of Terms
          </h2>
          <p className="mt-3 text-base leading-relaxed">
            By accessing or using the Britestate platform, you agree to be bound
            by these Terms of Service. If you do not agree, you must not use the
            platform.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-neutral-900">
            2. Description of Service
          </h2>
          <p className="mt-3 text-base leading-relaxed">
            Britestate provides an online property portal enabling users to
            search for properties, connect with estate agents and service
            providers, and track property transactions. We do not provide legal,
            financial, or surveying advice.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-neutral-900">
            3. User Accounts
          </h2>
          <p className="mt-3 text-base leading-relaxed">
            You must provide accurate information when creating an account. You
            are responsible for maintaining the confidentiality of your login
            credentials and for all activity under your account.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-neutral-900">
            4. Acceptable Use
          </h2>
          <p className="mt-3 text-base leading-relaxed">
            You agree not to misuse the platform, including but not limited to:
            uploading fraudulent listings, impersonating other users, scraping
            data, or engaging in activities that violate applicable UK law.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-neutral-900">
            5. Fees and Payments
          </h2>
          <p className="mt-3 text-base leading-relaxed">
            Certain services on the platform may require payment. Fees, payment
            terms, and refund policies will be clearly displayed before any
            purchase. Britestate uses Stripe for payment processing.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-neutral-900">
            6. Limitation of Liability
          </h2>
          <p className="mt-3 text-base leading-relaxed">
            Britestate is provided &ldquo;as is&rdquo; without warranties of
            any kind. We are not liable for any damages arising from your use of
            the platform, to the fullest extent permitted by law.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-neutral-900">
            7. Governing Law
          </h2>
          <p className="mt-3 text-base leading-relaxed">
            These terms are governed by the laws of England and Wales. Any
            disputes will be subject to the exclusive jurisdiction of the courts
            of England and Wales.
          </p>
        </section>
      </div>
    </div>
  );
}
