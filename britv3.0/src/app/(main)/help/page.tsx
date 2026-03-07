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
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      {/* Page header */}
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold text-neutral-900 sm:text-5xl">
          Help Center
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-600">
          Answers to the most common questions about using Britestate.
        </p>
      </div>

      {/* FAQ sections */}
      <div className="mt-16 space-y-12">
        {FAQ_SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="mb-4 font-heading text-xl font-semibold text-neutral-900">
              {section.title}
            </h2>

            <Accordion.Root className="divide-y divide-neutral-200 rounded-xl border border-neutral-200">
              {section.items.map((item) => (
                <Accordion.Item key={item.question} value={item.question}>
                  <Accordion.Header>
                    <Accordion.Trigger className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-neutral-900 transition-colors hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 data-[panel-open]:text-brand-primary">
                      {item.question}
                      <ChevronDown
                        size={16}
                        className="shrink-0 text-neutral-500 transition-transform duration-200 data-[panel-open]:rotate-180"
                      />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Panel className="overflow-hidden px-5 text-sm leading-relaxed text-neutral-600 data-[ending-style]:animate-none data-[starting-style]:animate-none">
                    <div className="pb-4 pt-1">{item.answer}</div>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </section>
        ))}
      </div>

      {/* Contact CTA */}
      <div className="mt-16 rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center">
        <p className="text-base font-medium text-neutral-900">
          Can&apos;t find what you&apos;re looking for?
        </p>
        <p className="mt-1 text-sm text-neutral-600">
          Our support team is happy to help.
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
