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
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-card p-8 text-center ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Article Not Found
          </h1>
          <p className="mt-2 font-body text-sm text-neutral-500">
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
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/help"
        className="font-body text-sm text-brand-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
      >
        &larr; Back to Help Centre
      </Link>

      <h1 className="mt-6 font-heading text-2xl font-bold text-foreground sm:text-3xl">
        {article.title}
      </h1>

      <SafeHTML html={article.content} className="prose prose-neutral dark:prose-invert mt-8 max-w-none" />
    </div>
  );
}
