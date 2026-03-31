import type { Metadata } from "next";
import Link from "next/link";
import {
  MapPin,
  ArrowRight,
  Briefcase,
  Users,
  Zap,
  Heart,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Careers | Britestate",
  description:
    "Join the team building the future of UK property. Explore open roles at Britestate.",
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
    icon: Zap,
    title: "Build in the open",
    description:
      "We share our progress, learnings, and challenges transparently with our team and users. Openness drives trust.",
  },
  {
    icon: Heart,
    title: "Move with purpose",
    description:
      "We ship fast but thoughtfully. Every feature we build is grounded in real user needs and measurable outcomes.",
  },
  {
    icon: Users,
    title: "Own the outcome",
    description:
      "Everyone at Britestate has the autonomy to make decisions and the accountability to deliver results.",
  },
];

const perks = [
  "Competitive salary + equity",
  "25 days holiday + bank holidays",
  "Flexible remote working",
  "£1,000 learning budget",
  "Private health insurance",
  "Home office setup allowance",
  "Team retreats twice a year",
  "Free property advice",
];

export default function CareersPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-brand-primary text-white py-20 lg:py-28">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6 text-sm font-semibold backdrop-blur-sm">
              <Briefcase className="size-4" />
              <span>We&apos;re hiring</span>
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Join Britestate
            </h1>
            <p className="text-white/80 text-lg sm:text-xl leading-relaxed mb-10">
              We are on a mission to make the UK property market transparent,
              fair, and accessible. Come build the future of property with us.
            </p>
            <Link
              href="#open-roles"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-white text-brand-primary text-sm font-semibold hover:bg-brand-primary-lighter transition-colors shadow-md"
            >
              View open roles
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Culture / Values */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
              Our Culture
            </h2>
            <p className="text-neutral-600 text-lg max-w-xl mx-auto">
              We move fast, work transparently, and take ownership of outcomes.
              Here&apos;s what makes Britestate different.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="flex flex-col gap-4 p-8 rounded-2xl bg-brand-primary-lighter hover:bg-brand-primary hover:text-white transition-all group"
              >
                <div className="size-12 rounded-xl bg-white/60 text-brand-primary group-hover:bg-white/20 group-hover:text-white flex items-center justify-center transition-all">
                  <value.icon className="size-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-brand-primary group-hover:text-white transition-colors">
                  {value.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed group-hover:text-white/80 transition-colors">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="bg-neutral-50 py-20 lg:py-28">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <h2 className="font-heading text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-6">
                Benefits & Perks
              </h2>
              <p className="text-neutral-600 text-lg leading-relaxed mb-8">
                We believe in taking care of our team. Beyond competitive pay,
                we offer benefits that help you do your best work and live well.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {perks.map((perk) => (
                  <div key={perk} className="flex items-center gap-3">
                    <div className="size-5 rounded-full bg-brand-primary-lighter text-brand-primary flex items-center justify-center shrink-0">
                      <svg className="size-3" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span className="text-sm text-neutral-700">{perk}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-brand-primary p-10 text-white text-center">
              <div className="font-heading text-5xl font-bold mb-2">4.9</div>
              <div className="text-white/80 mb-6">Glassdoor rating</div>
              <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-6">
                <div>
                  <div className="font-heading text-2xl font-bold">94%</div>
                  <div className="text-white/70 text-sm mt-1">
                    Would recommend
                  </div>
                </div>
                <div>
                  <div className="font-heading text-2xl font-bold">35+</div>
                  <div className="text-white/70 text-sm mt-1">Team members</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Roles */}
      <section id="open-roles" className="bg-white py-20 lg:py-28">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
              Open Roles
            </h2>
            <p className="text-neutral-600 text-lg max-w-xl mx-auto">
              We&apos;re a growing team with big ambitions. If you share our
              mission, we&apos;d love to hear from you.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {openRoles.map((role) => (
              <Link
                key={role.title}
                href="/contact"
                className="group flex items-center justify-between gap-4 p-6 rounded-2xl bg-neutral-50 hover:bg-brand-primary-lighter transition-colors"
              >
                <div>
                  <h3 className="font-heading text-base font-bold text-neutral-900 group-hover:text-brand-primary transition-colors">
                    {role.title}
                  </h3>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {role.department}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-500 shrink-0">
                  <span className="hidden sm:flex items-center gap-1.5">
                    <MapPin className="size-4" />
                    {role.location}
                  </span>
                  <span className="rounded-full bg-brand-primary-lighter px-3 py-1 text-xs font-semibold text-brand-primary">
                    {role.type}
                  </span>
                  <ArrowRight className="size-4 text-neutral-400 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-neutral-500">
            Don&apos;t see your role?{" "}
            <Link
              href="/contact"
              className="text-brand-primary font-medium underline-offset-4 hover:underline"
            >
              Send us a speculative application
            </Link>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-primary text-white py-20">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl lg:text-4xl font-bold tracking-tight mb-4">
            Ready to make your mark?
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
            We&apos;re always looking for talented people who share our passion
            for transforming the UK property market.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-white text-brand-primary text-sm font-semibold hover:bg-brand-primary-lighter transition-colors shadow-md"
          >
            Get in touch
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
