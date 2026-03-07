import type { Metadata } from "next";
import Link from "next/link";
import {
  Search,
  ShoppingBag,
  ClipboardCheck,
  Building2,
  ArrowRight,
  Shield,
  Users,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Britestate | UK Property Portal",
  description:
    "Find your perfect UK property. Search, compare, and transact with AI-powered matching and verified agents.",
};

const FEATURES = [
  {
    icon: Search,
    title: "Search & Compare",
    description:
      "Browse thousands of verified UK property listings with advanced filters and AI-powered recommendations.",
  },
  {
    icon: ShoppingBag,
    title: "Service Marketplace",
    description:
      "Find trusted conveyancers, surveyors, removals, and more -- all in one place with verified reviews.",
  },
  {
    icon: ClipboardCheck,
    title: "Transaction Tracking",
    description:
      "Track every step of your property transaction in real time with automated milestone updates.",
  },
  {
    icon: Building2,
    title: "Landlord Tools",
    description:
      "Manage tenancies, maintenance requests, and financial reporting from a single dashboard.",
  },
] as const;

const TRUST_BADGES = [
  { icon: Home, value: "10,000+", label: "Properties" },
  { icon: Users, value: "Verified", label: "Agents" },
  { icon: Shield, value: "Secure", label: "Platform" },
] as const;

const STEPS = [
  {
    step: "01",
    title: "Search",
    description: "Find properties matching your exact criteria with smart filters and map search.",
  },
  {
    step: "02",
    title: "Connect",
    description: "Contact verified agents, book viewings, and compare options side by side.",
  },
  {
    step: "03",
    title: "Complete",
    description: "Track your transaction from offer to completion with real-time progress updates.",
  },
] as const;

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-primary-lighter via-white to-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="max-w-2xl">
            <h1 className="font-heading text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
              Find Your Perfect{" "}
              <span className="text-brand-primary">Property</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-neutral-600 sm:text-xl">
              The all-in-one UK property portal. Search, compare, and transact
              with AI-powered matching, integrated services, and real-time
              transaction tracking.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" render={<Link href="/search" />}>
                Start Searching
                <ArrowRight className="size-4" data-icon="inline-end" />
              </Button>
              <Button variant="outline" size="lg" render={<Link href="/register?role=seller" />}>
                List Your Property
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative shape */}
        <div
          className="absolute -right-24 -top-24 size-96 rounded-full bg-brand-primary/5 blur-3xl"
          aria-hidden="true"
        />
      </section>

      {/* Trust Badges */}
      <section className="border-y bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-4 py-8 sm:gap-16 sm:px-6 lg:px-8">
          {TRUST_BADGES.map((badge) => (
            <div key={badge.label} className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-brand-primary-lighter">
                <badge.icon className="size-5 text-brand-primary" />
              </div>
              <div>
                <p className="font-heading text-lg font-bold text-neutral-900">
                  {badge.value}
                </p>
                <p className="text-sm text-neutral-500">{badge.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold text-neutral-900 sm:text-4xl">
              Everything You Need
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
              From search to completion, Britestate brings together every tool
              you need for your property journey.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs transition-shadow hover:shadow-md"
              >
                <div className="flex size-11 items-center justify-center rounded-lg bg-brand-primary-lighter">
                  <feature.icon className="size-5 text-brand-primary" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold text-neutral-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-neutral-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold text-neutral-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
              Getting started with Britestate is simple. Three steps to your new
              property.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.step} className="text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-primary text-lg font-bold text-white">
                  {step.step}
                </div>
                <h3 className="mt-4 font-heading text-xl font-semibold text-neutral-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-primary py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
            Ready to Find Your Dream Property?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
            Join thousands of homebuyers, renters, and landlords who trust
            Britestate for their property journey.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              variant="secondary"
              render={<Link href="/register" />}
            >
              Get Started Free
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
