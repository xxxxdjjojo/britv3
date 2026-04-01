import type { Metadata } from "next";
import Link from "next/link";
import { Accordion } from "@base-ui/react/accordion";
import { ChevronDown, Search, Home, TrendingUp, Briefcase, ArrowRight, MessageSquare, Phone } from "lucide-react";
import { FAQ_SECTIONS } from "@/content/help-faq";

export const metadata: Metadata = {
  title: "Help Center | Britestate",
  description:
    "Find answers to common questions about Britestate -- property search, accounts, service providers, messaging, and more.",
};

const POPULAR_TOPICS = [
  "How to book a viewing",
  "Verification process for buyers",
  "Understanding the offer stage",
  "Data privacy and security FAQ",
  "Fee structure for landlords",
  "Resetting your account password",
  "Applying for a mortgage via partners",
  "Moving day checklist",
  "Legal documentation guide",
] as const;

const ROLE_CARDS = [
  {
    icon: Home,
    title: "I am a Buyer / Renter",
    description:
      "Find your next home, understand buying processes, and manage your viewing schedule with ease.",
    bg: "bg-brand-primary-lighter",
    iconColor: "text-brand-primary",
    iconHoverBg: "group-hover:bg-brand-primary",
  },
  {
    icon: TrendingUp,
    title: "I am a Seller",
    description:
      "List your property, track performance metrics, and navigate the closing process professionally.",
    bg: "bg-brand-secondary-light",
    iconColor: "text-brand-secondary-dark",
    iconHoverBg: "group-hover:bg-brand-secondary-dark",
  },
  {
    icon: Briefcase,
    title: "I am a Professional",
    description:
      "Access industry insights, developer tools, and manage complex portfolios for your clients.",
    bg: "bg-surface-container-low",
    iconColor: "text-brand-primary",
    iconHoverBg: "group-hover:bg-brand-primary",
  },
] as const;

export default function HelpPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[460px] flex items-center justify-center overflow-hidden py-24 bg-surface-container-low">
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-surface" aria-hidden="true" />
        <div className="relative z-10 w-full max-w-3xl px-6 text-center">
          <h1 className="font-heading text-4xl md:text-6xl font-extrabold text-brand-primary-dark mb-6 tracking-tight">
            How can we help you today?
          </h1>
          <div className="relative group">
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-neutral-400 group-focus-within:text-brand-primary transition-colors"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Search for articles, guides, and more..."
              className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white shadow-xl border-none focus:ring-2 focus:ring-brand-primary/20 font-body text-base text-foreground placeholder:text-neutral-400 outline-none transition-all"
              aria-label="Search help articles"
            />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3 font-body text-sm text-neutral-500">
            <span>Popular:</span>
            <Link href="/help/stamp-duty-calculator" className="px-3 py-1 bg-white/70 rounded-full hover:bg-white transition-colors border border-neutral-200/60">
              Stamp Duty Calculator
            </Link>
            <Link href="/help/id-verification" className="px-3 py-1 bg-white/70 rounded-full hover:bg-white transition-colors border border-neutral-200/60">
              ID Verification
            </Link>
            <Link href="/help/viewing-requests" className="px-3 py-1 bg-white/70 rounded-full hover:bg-white transition-colors border border-neutral-200/60">
              Viewing Requests
            </Link>
          </div>
        </div>
      </section>

      {/* Role Cards — overlapping hero */}
      <section className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ROLE_CARDS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group p-8 rounded-2xl bg-white border border-neutral-100 shadow-lg hover:shadow-xl transition-all flex flex-col items-start gap-4"
            >
              <div className="w-14 h-14 rounded-xl bg-brand-primary-lighter flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                <Icon className="size-7" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-brand-primary-dark mb-2">{title}</h3>
                <p className="font-body text-sm text-neutral-500 leading-relaxed">{description}</p>
              </div>
              <button className="mt-4 font-body text-sm font-semibold text-brand-primary flex items-center gap-2 group/btn">
                Explore Guides{" "}
                <ArrowRight className="size-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Topics */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-xl">
            <h2 className="font-heading text-3xl font-bold text-brand-primary-dark mb-4">Popular Topics</h2>
            <p className="font-body text-neutral-500">
              Instant answers to our community&rsquo;s most frequently asked questions. Our knowledge base is updated weekly.
            </p>
          </div>
          <Link
            href="/help/all"
            className="font-body text-sm font-semibold text-brand-primary border-b-2 border-brand-primary/20 pb-1 hover:border-brand-primary transition-all whitespace-nowrap"
          >
            View all 150+ articles
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {POPULAR_TOPICS.map((topic) => (
            <Link
              key={topic}
              href={`/help/${topic.toLowerCase().replace(/ /g, "-")}`}
              className="p-5 flex items-center justify-between rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors group"
            >
              <span className="font-body font-medium text-foreground">{topic}</span>
              <ChevronDown
                className="size-5 -rotate-90 text-neutral-400 group-hover:text-brand-primary transition-colors"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="font-heading text-2xl font-bold text-brand-primary-dark mb-8">Frequently Asked Questions</h2>
        <div className="space-y-8">
          {FAQ_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="mb-3 font-body text-xs font-semibold uppercase tracking-widest text-neutral-400">
                {section.title}
              </h3>
              <div className="overflow-hidden rounded-xl bg-card ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
                <Accordion.Root className="divide-y divide-neutral-200/60 dark:divide-neutral-700/60">
                  {section.items.map((item) => (
                    <Accordion.Item key={item.question} value={item.question}>
                      <Accordion.Header>
                        <Accordion.Trigger className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-body text-sm font-medium text-foreground transition-colors hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2 data-[panel-open]:text-brand-primary">
                          {item.question}
                          <ChevronDown
                            size={16}
                            className="shrink-0 text-neutral-500 transition-transform duration-200 data-[panel-open]:rotate-180"
                          />
                        </Accordion.Trigger>
                      </Accordion.Header>
                      <Accordion.Panel className="overflow-hidden px-5 font-body text-sm leading-relaxed text-neutral-500 data-[ending-style]:animate-none data-[starting-style]:animate-none">
                        <div className="pb-4 pt-1">{item.answer}</div>
                      </Accordion.Panel>
                    </Accordion.Item>
                  ))}
                </Accordion.Root>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="max-w-7xl mx-auto px-6 mb-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-primary p-12 text-center">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" aria-hidden="true" />
          <div className="relative z-10">
            <h2 className="font-heading text-3xl font-bold text-white mb-4">
              Can&rsquo;t find what you need?
            </h2>
            <p className="font-body text-white/80 max-w-lg mx-auto mb-8">
              Our support specialists are available 24/7 to help you with any questions or complex property matters.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-primary font-heading font-bold rounded-xl hover:bg-neutral-50 transition-all shadow-lg"
              >
                <Phone className="size-5" />
                Contact Support
              </Link>
              <button className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white font-heading font-bold rounded-xl hover:bg-white/20 transition-all">
                <MessageSquare className="size-5" />
                Live Chat
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
