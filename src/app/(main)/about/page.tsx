import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | TrueDeed",
  description:
    "Learn about TrueDeed -- the UK property portal that brings together search, services, and transactions in one platform.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold text-neutral-900 sm:text-5xl">
          About TrueDeed
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
          We are building the future of UK property transactions -- transparent,
          efficient, and accessible to everyone.
        </p>
      </div>

      {/* Mission */}
      <section className="mt-16">
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          Our Mission
        </h2>
        <p className="mt-4 text-base leading-relaxed text-neutral-600">
          TrueDeed exists to make the UK property market fair and transparent
          for everyone. Whether you are buying your first home, renting a flat,
          managing a portfolio, or providing property services, our platform
          connects you with the tools, people, and information you need.
        </p>
        <p className="mt-4 text-base leading-relaxed text-neutral-600">
          We believe property transactions should not be stressful, opaque, or
          unnecessarily expensive. By bringing search, services, and transaction
          tracking into a single platform, we are removing the friction that has
          defined the UK property market for decades.
        </p>
      </section>

      {/* Values */}
      <section className="mt-16">
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          Our Values
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {[
            {
              title: "Transparency",
              description:
                "Every fee, every step, every update -- visible to all parties. No hidden costs, no surprises.",
            },
            {
              title: "Trust",
              description:
                "Verified agents, authenticated users, and secure transactions built on robust identity checks.",
            },
            {
              title: "Accessibility",
              description:
                "A platform designed for everyone, from first-time buyers to experienced property professionals.",
            },
            {
              title: "Innovation",
              description:
                "AI-powered matching, real-time tracking, and integrated services that simplify complex processes.",
            },
          ].map((value) => (
            <div
              key={value.title}
              className="rounded-xl border border-neutral-200 p-6"
            >
              <h3 className="font-heading text-lg font-semibold text-neutral-900">
                {value.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Team Placeholder */}
      <section className="mt-16">
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          Our Team
        </h2>
        <p className="mt-4 text-base leading-relaxed text-neutral-600">
          TrueDeed is built by a team of property industry veterans,
          technologists, and designers who share a passion for improving the UK
          property experience. More details coming soon.
        </p>
      </section>
    </div>
  );
}
