import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SafeHTML } from "@/components/ui/SafeHTML";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    title: `${title} | Help | Britestate`,
    description: `Help article: ${title.toLowerCase()}.`,
  };
}

export default async function HelpArticlePage({ params }: Props) {
  const { slug } = await params;

  let article: { title: string; content: string } | null = null;
  let fetchError = false;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cms_pages")
      .select("title, content")
      .eq("type", "help")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (error) throw error;
    article = data;
  } catch {
    fetchError = true;
  }

  if (fetchError || !article) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-2xl bg-surface-container-lowest border border-[--color-outline-variant] p-8 text-center shadow-sm">
          <h1 className="font-heading text-2xl font-bold text-brand-primary-dark">
            Article Not Found
          </h1>
          <p className="mt-2 font-body text-sm text-[--color-on-surface-variant]">
            We could not find the help article you are looking for.
          </p>
          <Link
            href="/help"
            className="mt-4 inline-block font-body text-sm text-brand-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
          >
            Back to Help Centre
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 font-body text-xs text-[--color-on-surface-variant] mb-8">
        <Link href="/help" className="hover:text-brand-primary transition-colors">
          Help Centre
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-foreground">{article.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12">
        {/* Content Area */}
        <article className="max-w-3xl">
          <header className="mb-10">
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-brand-primary-dark tracking-tight mb-6">
              {article.title}
            </h1>
          </header>

          <SafeHTML
            html={article.content}
            className="prose prose-neutral dark:prose-invert max-w-none"
          />

          {/* Feedback Section */}
          <div className="mt-20 pt-10 border-t border-[--color-outline-variant]">
            <div className="bg-surface-container-low rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="font-heading text-lg font-bold text-foreground">Was this article helpful?</h4>
                <p className="font-body text-sm text-[--color-on-surface-variant] mt-1">Help us improve our documentation.</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-6 py-2.5 bg-surface-container-lowest border border-[--color-outline-variant] rounded-full font-body font-semibold text-sm hover:border-brand-primary hover:text-brand-primary transition-all shadow-sm">
                  Yes
                </button>
                <button className="flex items-center gap-2 px-6 py-2.5 bg-surface-container-lowest border border-[--color-outline-variant] rounded-full font-body font-semibold text-sm hover:border-error hover:text-error transition-all shadow-sm">
                  No
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="space-y-8">
          {/* Contact Support */}
          <section className="bg-brand-primary text-white rounded-2xl p-6 shadow-lg">
            <div className="mb-4 bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h3 className="font-heading text-xl font-bold mb-2">Still need help?</h3>
            <p className="font-body text-white/80 text-sm mb-6 leading-relaxed">
              Our support team is available 24/7 to assist with your property journey.
            </p>
            <Link
              href="/contact"
              className="block w-full text-center py-3 bg-surface-container-lowest text-brand-primary rounded-full font-heading font-bold text-sm hover:bg-[--color-surface-container-low] active:scale-[0.98] transition-all"
            >
              Contact Support
            </Link>
          </section>

          {/* Back to Help Centre */}
          <section className="bg-surface-container-lowest border border-[--color-outline-variant] rounded-2xl p-6 shadow-sm">
            <h3 className="font-body text-sm font-bold uppercase tracking-wider text-[--color-on-surface-variant] mb-4">
              Navigation
            </h3>
            <Link
              href="/help"
              className="font-body text-sm font-medium text-brand-primary hover:underline"
            >
              &larr; Back to Help Centre
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
