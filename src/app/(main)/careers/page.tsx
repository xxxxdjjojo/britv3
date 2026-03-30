import type { Metadata } from "next";
import Link from "next/link";
import {
  MapPin,
  Briefcase,
  ArrowRight,
  Sparkles,
  Eye,
  Zap,
  Target,
  Users,
  Rocket,
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

const VALUES = [
  {
    icon: Eye,
    title: "Build in the open",
    description:
      "We share our progress, learnings, and challenges transparently with our team and users. Openness drives trust.",
  },
  {
    icon: Zap,
    title: "Move with purpose",
    description:
      "We ship fast but thoughtfully. Every feature we build is grounded in real user needs and measurable outcomes.",
  },
  {
    icon: Target,
    title: "Own the outcome",
    description:
      "Everyone at Britestate has the autonomy to make decisions and the accountability to deliver results.",
  },
];

const PERKS = [
  {
    icon: Rocket,
    title: "Equity & ownership",
    description: "Share in the success you help build. Generous option grants for all team members.",
  },
  {
    icon: Heart,
    title: "Wellbeing first",
    description: "Private healthcare, mental health support, and 25 days annual leave.",
  },
  {
    icon: Users,
    title: "Flexible working",
    description: "Remote-friendly culture with optional London office. Work where you do your best work.",
  },
  {
    icon: Sparkles,
    title: "Learning budget",
    description: "£1,500 per year for courses, books, conferences, and professional development.",
  },
];

const DEPT_COLOURS: Record<string, string> = {
  Engineering: "bg-brand-primary-lighter text-brand-primary",
  Design: "bg-brand-secondary-light text-brand-secondary",
  "Business Development": "bg-info-light text-info",
  Operations: "bg-success-light text-success",
};

export default function CareersPage() {
  return (
    <div className="bg-neutral-50">
      {/* Hero */}
      <section className="bg-brand-primary text-white py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 text-sm font-semibold">
            <Sparkles className="size-4" />
            <span>We&apos;re growing fast</span>
          </div>
          <h1 className="font-heading text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Join Britestate
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            We are on a mission to make the UK property market transparent, fair,
            and accessible. Come build the future of property with us.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-white/70">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-success inline-block" />
              {openRoles.length} open roles
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" />
              London &amp; Remote (UK)
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase className="size-4" />
              Seed stage — high impact
            </span>
          </div>
        </div>
      </section>

      {/* Open Roles */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-10">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight mb-3">
            Open Roles
          </h2>
          <p className="text-neutral-600">
            All roles include equity, flexible working, and a genuine opportunity
            to shape a category-defining product.
          </p>
        </div>
        <div className="space-y-4">
          {openRoles.map((role) => (
            <Link
              key={role.title}
              href="/contact"
              className="group block bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 duration-300"
              aria-label={`Apply for ${role.title}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        DEPT_COLOURS[role.department] ??
                        "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {role.department}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-neutral-900 group-hover:text-brand-primary transition-colors">
                    {role.title}
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-500">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-4 shrink-0" />
                    {role.location}
                  </span>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                    {role.type}
                  </span>
                  <ArrowRight className="size-4 text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-6 text-sm text-neutral-500">
          Don&apos;t see your role?{" "}
          <Link
            href="/contact"
            className="text-brand-primary font-medium underline-offset-4 hover:underline"
          >
            Send us a speculative application
          </Link>
        </p>
      </section>

      {/* Culture / Values */}
      <section className="bg-brand-primary-lighter py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
              Our Culture
            </h2>
            <p className="text-neutral-600 text-lg max-w-xl mx-auto">
              The values we live by every day.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {VALUES.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="size-12 rounded-xl bg-brand-primary-lighter flex items-center justify-center text-brand-primary mb-5">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-neutral-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-neutral-600 text-sm leading-relaxed">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
            Perks &amp; Benefits
          </h2>
          <p className="text-neutral-600 text-lg max-w-xl mx-auto">
            We take care of our team so our team can take care of our users.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PERKS.map((perk) => {
            const Icon = perk.icon;
            return (
              <div
                key={perk.title}
                className="bg-white rounded-2xl p-6 shadow-sm text-center hover:shadow-md transition-shadow"
              >
                <div className="size-12 rounded-2xl bg-brand-primary-lighter flex items-center justify-center text-brand-primary mx-auto mb-4">
                  <Icon className="size-6" />
                </div>
                <h3 className="font-heading text-base font-semibold text-neutral-900 mb-2">
                  {perk.title}
                </h3>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  {perk.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-primary text-white py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to make your move?
          </h2>
          <p className="text-white/80 text-lg mb-10">
            Join us in building a property platform the UK can be proud of.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 h-14 px-10 rounded-xl bg-white text-brand-primary font-semibold text-base hover:bg-neutral-100 transition-colors shadow-md"
          >
            Get in Touch
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
