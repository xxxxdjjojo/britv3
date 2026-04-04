/**
 * FAQ accordion for SEO category landing pages.
 *
 * Server Component — renders <details>/<summary> accordion with no JS required.
 * Also injects FAQ JSON-LD (FAQPage schema) in a <script> tag.
 */

import { ChevronDown } from "lucide-react";
import type { FAQItem } from "@/lib/providers/seo-utils";

type Props = Readonly<{
  faqs: FAQItem[];
  category: string;
  location: string;
}>;

export function CategoryPageFAQ({ faqs, category: _category, location: _location }: Props) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <section className="mt-16 border-t border-neutral-200 dark:border-neutral-800 pt-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <details
            key={i}
            className="group border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden"
          >
            <summary className="flex items-center justify-between p-6 cursor-pointer font-semibold list-none hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
              {faq.question}
              <ChevronDown className="w-5 h-5 text-neutral-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="px-6 pb-6 text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
              {faq.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
