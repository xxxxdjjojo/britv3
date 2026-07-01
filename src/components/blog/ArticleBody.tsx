import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import type { ArticleBlock } from "@/content/blog/types";

function isInternal(href: string): boolean {
  return href.startsWith("/");
}

/**
 * Renders a blog article's structured body. Kept as a standalone, synchronous
 * component so both the article page and unit tests can render it directly.
 */
export function ArticleBody({ blocks }: { blocks: readonly ArticleBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "paragraph":
            return (
              <p
                key={i}
                className="mb-5 text-base leading-relaxed text-neutral-700"
              >
                {block.text}
              </p>
            );
          case "h2":
            return (
              <h2
                key={i}
                className="mb-4 mt-10 font-heading text-2xl font-bold text-neutral-900"
              >
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3
                key={i}
                className="mb-3 mt-8 font-heading text-xl font-bold text-neutral-900"
              >
                {block.text}
              </h3>
            );
          case "blockquote":
            return (
              <blockquote
                key={i}
                className="my-6 rounded-r-xl border-l-4 border-brand-primary bg-brand-primary-lighter px-6 py-4 font-medium italic leading-relaxed text-brand-primary"
              >
                &ldquo;{block.text}&rdquo;
              </blockquote>
            );
          case "list":
            return (
              <ul
                key={i}
                className="mb-5 list-inside list-disc space-y-2 text-neutral-700"
              >
                {block.items.map((item, j) => (
                  <li key={j} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            );
          case "cta":
            return (
              <div
                key={i}
                className="my-8 flex flex-col gap-4 rounded-2xl border border-brand-primary/15 bg-brand-primary-lighter p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-base font-medium leading-relaxed text-brand-primary">
                  {block.text}
                </p>
                <Link
                  href={block.href}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-light"
                >
                  {block.label}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            );
          case "faq":
            return (
              <section
                key={i}
                aria-label="Frequently asked questions"
                className="my-10"
              >
                <h2 className="mb-5 font-heading text-2xl font-bold text-neutral-900">
                  Frequently asked questions
                </h2>
                <div className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-100 bg-white">
                  {block.items.map((qa, j) => (
                    <details key={j} className="group px-5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-heading text-base font-semibold text-neutral-900 [&::-webkit-details-marker]:hidden">
                        {qa.question}
                        <ChevronDown className="size-5 shrink-0 text-brand-primary transition-transform group-open:rotate-180" />
                      </summary>
                      <p className="pb-5 text-base leading-relaxed text-neutral-700">
                        {qa.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            );
          case "links":
            return (
              <nav
                key={i}
                aria-label={block.heading}
                className="my-8 rounded-2xl border border-neutral-100 bg-muted p-6"
              >
                <p className="mb-3 font-heading text-sm font-bold uppercase tracking-wider text-brand-primary">
                  {block.heading}
                </p>
                <ul className="space-y-2">
                  {block.items.map((item, j) => (
                    <li key={j}>
                      {isInternal(item.href) ? (
                        <Link
                          href={item.href}
                          className="group inline-flex items-center gap-2 text-base font-medium text-neutral-800 transition-colors hover:text-brand-primary"
                        >
                          <ArrowRight className="size-4 shrink-0 text-brand-primary transition-transform group-hover:translate-x-0.5" />
                          {item.label}
                        </Link>
                      ) : (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-2 text-base font-medium text-neutral-800 transition-colors hover:text-brand-primary"
                        >
                          <ArrowUpRight className="size-4 shrink-0 text-brand-primary" />
                          {item.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            );
          default:
            return null;
        }
      })}
    </>
  );
}
