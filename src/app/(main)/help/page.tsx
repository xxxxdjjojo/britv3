import type { Metadata } from "next";
import Link from "next/link";
import { Accordion } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";
import { FAQ_SECTIONS } from "@/content/help-faq";

export const metadata: Metadata = {
  title: "Help Center | Britestate",
  description:
    "Find answers to common questions about Britestate -- property search, accounts, service providers, messaging, and more.",
};

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Help Centre
        </h1>
        <p className="mx-auto mt-2 max-w-xl font-body text-base text-neutral-500">
          Answers to the most common questions about using Britestate.
        </p>
      </div>

      {/* FAQ sections */}
      <div className="mt-10 space-y-8">
        {FAQ_SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">
              {section.title}
            </h2>

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
          </section>
        ))}
      </div>

      {/* Contact CTA */}
      <div className="mt-12 rounded-xl bg-card p-8 text-center ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
        <p className="font-heading text-base font-semibold text-foreground">
          Can&apos;t find what you&apos;re looking for?
        </p>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Our support team is happy to help.
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-brand-primary px-6 py-2.5 font-body text-sm font-medium text-white transition-colors hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
