import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Careers | TrueDeed",
  description:
    "Join the team building the future of UK property. Explore open roles at TrueDeed.",
};

const openRoles = [
  {
    title: "Senior Full-Stack Engineer",
    department: "Engineering",
    location: "London / Remote",
    type: "Full-time",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "London / Remote",
    type: "Full-time",
  },
  {
    title: "Head of Partnerships",
    department: "Business Development",
    location: "London",
    type: "Full-time",
  },
  {
    title: "Customer Success Manager",
    department: "Operations",
    location: "Remote (UK)",
    type: "Full-time",
  },
];

const values = [
  {
    title: "Build in the open",
    description:
      "We share our progress, learnings, and challenges transparently with our team and users. Openness drives trust.",
  },
  {
    title: "Move with purpose",
    description:
      "We ship fast but thoughtfully. Every feature we build is grounded in real user needs and measurable outcomes.",
  },
  {
    title: "Own the outcome",
    description:
      "Everyone at TrueDeed has the autonomy to make decisions and the accountability to deliver results.",
  },
];

export default function CareersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      {/* Hero */}
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold text-neutral-900 sm:text-5xl">
          Join TrueDeed
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
          We are on a mission to make the UK property market transparent, fair,
          and accessible. Come build the future of property with us.
        </p>
      </div>

      {/* Open Roles */}
      <section className="mt-16">
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          Open Roles
        </h2>
        <div className="mt-6 space-y-4">
          {openRoles.map((role) => (
            <Link
              key={role.title}
              href="/contact"
              className="block rounded-xl border border-neutral-200 p-5 transition-colors hover:border-neutral-300 hover:bg-muted"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-heading text-base font-semibold text-neutral-900">
                    {role.title}
                  </h3>
                  <p className="mt-0.5 text-sm text-neutral-500">
                    {role.department}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-500">
                  <span className="inline-flex items-center gap-1">
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    {role.location}
                  </span>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                    {role.type}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-sm text-neutral-500">
          Don&apos;t see your role?{" "}
          <Link
            href="/contact"
            className="text-brand-primary underline underline-offset-4"
          >
            Send us a speculative application
          </Link>
        </p>
      </section>

      {/* Culture / Values */}
      <section className="mt-16">
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          Our Culture
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {values.map((value) => (
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

      {/* CTA */}
      <div className="mt-16 text-center">
        <Button asChild size="lg">
          <Link href="/contact">Get in Touch</Link>
        </Button>
      </div>
    </div>
  );
}
