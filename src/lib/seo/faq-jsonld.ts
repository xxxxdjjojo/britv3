/**
 * FAQPage JSON-LD helper.
 *
 * Emits schema.org `FAQPage` structured data from a list of question/answer
 * pairs so the FAQ rendered as semantic HTML can also surface as rich results.
 * Answers are plain text — strip any markup before passing them in.
 */

export type FaqItem = Readonly<{ question: string; answer: string }>;

export function faqJsonLd(items: readonly FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
