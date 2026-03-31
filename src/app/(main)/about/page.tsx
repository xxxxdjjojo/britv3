import type { Metadata } from "next";
import Link from "next/link";
import {
  Eye,
  ShieldCheck,
  Accessibility,
  Sparkles,
  ArrowRight,
  Target,
  Heart,
  Globe,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About | Britestate",
  description:
    "Learn about Britestate — the UK property portal that brings together search, services, and transactions in one platform.",
};

const VALUES = [
  {
    icon: Eye,
    title: "Transparency",
    description:
      "Every fee, every step, every update — visible to all parties. No hidden costs, no surprises.",
  },
  {
    icon: ShieldCheck,
    title: "Trust",
    description:
      "Verified agents, authenticated users, and secure transactions built on robust identity checks.",
  },
  {
    icon: Accessibility,
    title: "Accessibility",
    description:
      "A platform designed for everyone, from first-time buyers to experienced property professionals.",
  },
  {
    icon: Sparkles,
    title: "Innovation",
    description:
      "AI-powered matching, real-time tracking, and integrated services that simplify complex processes.",
  },
];

const TEAM = [
  {
    name: "Sarah Chen",
    role: "Co-founder & CEO",
    background: "10 years in PropTech",
  },
  {
    name: "James Williams",
    role: "Co-founder & CTO",
    background: "Former engineering lead at Zoopla",
  },
  {
    name: "Priya Sharma",
    role: "Head of Design",
    background: "Ex-Rightmove product designer",
  },
  {
    name: "Tom Bradley",
    role: "Head of Operations",
    background: "RICS-qualified surveyor",
  },
];

const MILESTONES = [
  { year: "2022", event: "Britestate founded in London" },
  { year: "2023", event: "Launched beta with 500 verified agents" },
  { year: "2024", event: "Reached 10,000 active listings" },
  { year: "2025", event: "Surpassed 50,000 completed moves" },
  { year: "2026", event: "Launched AI-powered property intelligence" },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-brand-primary text-white py-20 lg:py-28">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6 text-sm font-semibold backdrop-blur-sm">
              <Target className="size-4" />
              <span>Our Story</span>
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Building the future of UK property
            </h1>
            <p className="text-white/80 text-lg sm:text-xl leading-relaxed">
              We are on a mission to make the UK property market transparent,
              fair, and accessible to everyone — whether you are buying your
              first home, managing a portfolio, or providing services.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-primary-lighter text-brand-primary rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
                <Heart className="size-4" />
                <span>Our Mission</span>
              </div>
              <h2 className="font-heading text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-6">
                Removing the friction from property transactions
              </h2>
              <p className="text-neutral-600 text-lg leading-relaxed mb-4">
                Britestate exists to make the UK property market fair and
                transparent for everyone. Whether you are buying your first
                home, renting a flat, managing a portfolio, or providing
                property services, our platform connects you with the tools,
                people, and information you need.
              </p>
              <p className="text-neutral-600 leading-relaxed">
                We believe property transactions should not be stressful, opaque,
                or unnecessarily expensive. By bringing search, services, and
                transaction tracking into a single platform, we are removing the
                friction that has defined the UK property market for decades.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "50,000+", label: "Moves Completed" },
                { value: "£1.2B", label: "Property Transacted" },
                { value: "5,000+", label: "Verified Pros" },
                { value: "4.9/5", label: "User Rating" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col gap-1 p-6 rounded-2xl bg-brand-primary-lighter text-center"
                >
                  <span className="font-heading text-3xl font-bold text-brand-primary">
                    {stat.value}
                  </span>
                  <span className="text-sm text-neutral-600">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-neutral-50 py-20 lg:py-28">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-brand-primary-lighter text-brand-primary rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
              <Globe className="size-4" />
              <span>Our Values</span>
            </div>
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
              What we stand for
            </h2>
            <p className="text-neutral-600 text-lg max-w-xl mx-auto">
              Our values guide every decision we make — from product features to
              how we treat our users and partners.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="flex gap-5 p-7 rounded-2xl bg-white shadow-sm border border-neutral-100 hover:shadow-md transition-shadow"
              >
                <div className="size-12 rounded-xl bg-brand-primary-lighter text-brand-primary flex items-center justify-center shrink-0">
                  <value.icon className="size-6" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-neutral-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="font-heading text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
                Our journey so far
              </h2>
              <p className="text-neutral-600 text-lg">
                From a small team in London to the UK&apos;s fastest-growing
                property platform.
              </p>
            </div>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-neutral-200" aria-hidden="true" />
              <div className="space-y-8">
                {MILESTONES.map((milestone, i) => (
                  <div key={milestone.year} className="relative flex gap-6 pl-10">
                    <div className="absolute left-0 top-1 size-8 rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center shadow-sm">
                      {i + 1}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                        {milestone.year}
                      </span>
                      <p className="mt-0.5 text-neutral-700 font-medium">
                        {milestone.event}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-neutral-50 py-20 lg:py-28">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
              Our Team
            </h2>
            <p className="text-neutral-600 text-lg max-w-xl mx-auto">
              Britestate is built by property industry veterans, technologists,
              and designers who share a passion for improving the UK property
              experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map((member) => (
              <div
                key={member.name}
                className="flex flex-col gap-3 p-6 rounded-2xl bg-white shadow-sm border border-neutral-100 text-center"
              >
                <div className="size-16 rounded-full bg-brand-primary-lighter text-brand-primary flex items-center justify-center mx-auto text-xl font-bold font-heading">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-neutral-900">
                    {member.name}
                  </h3>
                  <p className="text-sm font-medium text-brand-primary mt-0.5">
                    {member.role}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1.5">
                    {member.background}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-primary text-white py-20">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl lg:text-4xl font-bold tracking-tight mb-4">
            Join us on our mission
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
            Whether you&apos;re looking to buy, rent, sell, or work in property —
            Britestate is built for you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-white text-brand-primary text-sm font-semibold hover:bg-brand-primary-lighter transition-colors shadow-md"
            >
              Get started free
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              View open roles
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
