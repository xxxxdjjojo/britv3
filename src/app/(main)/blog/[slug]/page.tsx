import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Calendar, Clock, Linkedin, Twitter } from "lucide-react";
import { CopyLinkButton } from "./CopyLinkButton";
import { NewsletterForm } from "@/components/blog/NewsletterForm";
import {
  categoryToSlug,
  getAllSlugs,
  getPostBySlug,
  getRelatedPosts,
} from "@/content/blog";
import type { ArticleBlock } from "@/content/blog/types";

type Props = {
  params: Promise<{ slug: string }>;
};

const SITE = "https://truedeed.co.uk";

export function generateStaticParams(): { slug: string }[] {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return { title: "Article not found | TrueDeed Blog" };
  }

  const canonical = `${SITE}/blog/${slug}`;

  return {
    title: post.seo.title,
    description: post.seo.description,
    keywords: [...post.keywords],
    alternates: { canonical },
    openGraph: {
      title: post.seo.title,
      description: post.seo.description,
      type: "article",
      url: canonical,
      publishedTime: post.date,
      authors: [post.author.name],
      images: [
        {
          url: `${SITE}${post.heroImage}`,
          alt: post.heroAlt,
        },
      ],
    },
  };
}

function ArticleBody({ blocks }: { blocks: readonly ArticleBlock[] }) {
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
          default:
            return null;
        }
      })}
    </>
  );
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const canonical = `${SITE}/blog/${slug}`;
  const relatedPosts = getRelatedPosts(slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.seo.description,
    image: `${SITE}${post.heroImage}`,
    datePublished: post.date,
    author: {
      "@type": "Person",
      name: post.author.name,
      jobTitle: post.author.title,
    },
    publisher: {
      "@type": "Organization",
      name: "TrueDeed",
      logo: {
        "@type": "ImageObject",
        url: `${SITE}/icons/icon-512.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        // JSON-LD is generated from trusted internal content, not user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumbs */}
      <nav
        className="mb-8 flex flex-wrap items-center gap-2 text-sm text-neutral-500"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="transition-colors hover:text-brand-primary">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/blog" className="transition-colors hover:text-brand-primary">
          Blog
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/blog?category=${categoryToSlug(post.category)}`}
          className="transition-colors hover:text-brand-primary"
        >
          {post.category}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="line-clamp-1 max-w-[220px] font-medium text-neutral-900">
          {post.title}
        </span>
      </nav>

      <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-12">
        {/* ── Main article column ── */}
        <article className="min-w-0">
          <header className="mb-8">
            <span className="mb-4 inline-block rounded-full bg-brand-primary-lighter px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-primary">
              {post.category}
            </span>
            <h1 className="mb-4 font-heading text-3xl font-bold leading-snug text-neutral-900 lg:text-4xl">
              {post.title}
            </h1>
            <p className="mb-6 text-lg leading-relaxed text-neutral-600">
              {post.excerpt}
            </p>

            {/* Author + meta row */}
            <div className="flex flex-col gap-4 rounded-xl border border-neutral-100 bg-muted p-4 sm:flex-row sm:items-center">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white">
                {post.author.initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-neutral-900">
                  {post.author.name}
                </div>
                <div className="text-sm text-neutral-500">
                  {post.author.title}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4 text-sm text-neutral-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-4 shrink-0" />
                  <span>{post.dateLabel}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="size-4 shrink-0" />
                  <span>{post.readTime}</span>
                </div>
              </div>
            </div>

            {/* Share buttons */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-neutral-600">
                Share:
              </span>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(canonical)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-brand-primary hover:text-brand-primary"
              >
                <Twitter className="size-4" />
                Share on Twitter
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonical)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-brand-primary hover:text-brand-primary"
              >
                <Linkedin className="size-4" />
                Share on LinkedIn
              </a>
              <CopyLinkButton url={canonical} />
            </div>
          </header>

          {/* Hero image */}
          <div className="mb-8 overflow-hidden rounded-2xl">
            <Image
              src={post.heroImage}
              alt={post.heroAlt}
              width={1200}
              height={675}
              priority
              sizes="(min-width: 1024px) 70vw, 100vw"
              className="aspect-[16/9] w-full object-cover"
            />
          </div>

          {/* Article body */}
          <div className="mb-12 max-w-none">
            <ArticleBody blocks={post.body} />
          </div>

          {/* Author bio */}
          <div className="mb-12 flex gap-5 rounded-2xl border border-neutral-100 bg-white p-6">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-primary text-lg font-bold text-white">
              {post.author.initials}
            </span>
            <div>
              <div className="mb-0.5 text-lg font-bold text-neutral-900">
                {post.author.name}
              </div>
              <div className="mb-3 text-sm font-medium text-brand-primary">
                {post.author.title}
              </div>
              <p className="text-sm leading-relaxed text-neutral-600">
                {post.author.bio}
              </p>
            </div>
          </div>

          {/* Related posts */}
          {relatedPosts.length > 0 ? (
            <section aria-labelledby="related-heading">
              <h2
                id="related-heading"
                className="mb-6 font-heading text-2xl font-bold text-neutral-900"
              >
                Related articles
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((item) => (
                  <article
                    key={item.slug}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white transition-shadow hover:shadow-md"
                  >
                    <Link
                      href={`/blog/${item.slug}`}
                      className="flex flex-1 flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                    >
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-100">
                        <Image
                          src={item.heroImage}
                          alt={item.heroAlt}
                          width={480}
                          height={270}
                          loading="lazy"
                          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <span className="mb-2 w-fit rounded-full bg-brand-primary-lighter px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-brand-primary">
                          {item.category}
                        </span>
                        <h3 className="mb-3 line-clamp-2 flex-1 font-heading text-sm font-bold leading-snug text-neutral-900 transition-colors group-hover:text-brand-primary">
                          {item.title}
                        </h3>
                        <div className="mt-auto flex items-center gap-2 text-xs text-neutral-500">
                          <Clock className="size-3 shrink-0" />
                          <span>{item.readTime}</span>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </article>

        {/* ── Sidebar ── */}
        <aside className="hidden lg:block">
          <div className="sticky top-8 flex flex-col gap-6">
            {relatedPosts.length > 0 ? (
              <div className="rounded-2xl border border-neutral-100 bg-white p-5">
                <h2 className="mb-4 font-heading text-base font-bold text-neutral-900">
                  Keep reading
                </h2>
                <div className="flex flex-col gap-3">
                  {relatedPosts.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/blog/${item.slug}`}
                      className="group flex flex-col gap-1 rounded-xl p-3 transition-colors hover:bg-muted"
                    >
                      <span className="mb-1 w-fit rounded-full bg-brand-primary-lighter px-2 py-0.5 text-xs font-semibold text-brand-primary">
                        {item.category}
                      </span>
                      <span className="text-sm font-semibold leading-snug text-neutral-900 transition-colors group-hover:text-brand-primary">
                        {item.title}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-neutral-400">
                        <Clock className="size-3" />
                        {item.readTime}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Newsletter */}
            <div className="rounded-2xl border border-brand-primary/10 bg-brand-primary-lighter p-5">
              <h2 className="mb-2 font-heading text-base font-bold text-brand-primary">
                Property insights, weekly
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-neutral-700">
                Expert guidance for every stage of your property journey,
                straight to your inbox.
              </p>
              <NewsletterForm source="blog" variant="card" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
