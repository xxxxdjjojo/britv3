import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NewsletterForm } from "@/components/blog/NewsletterForm";
import {
  BLOG_CATEGORIES,
  categoryToSlug,
  getAllPosts,
  getFeaturedPost,
  getPostsByCategory,
  type BlogCategory,
  type BlogPost,
} from "@/content/blog";

export const metadata: Metadata = {
  title: "TrueDeed Blog | Property Advice & Insights",
  description:
    "Expert guidance for every stage of your property journey — buying, renting, selling, and investing in UK property.",
  openGraph: {
    title: "TrueDeed Blog | Property Advice & Insights",
    description:
      "Expert guidance for every stage of your property journey — buying, renting, selling, and investing in UK property.",
    type: "website",
    url: "https://truedeed.co.uk/blog",
  },
};

function resolveCategory(slug?: string): BlogCategory | null {
  if (!slug) return null;
  return (
    BLOG_CATEGORIES.find((category) => categoryToSlug(category) === slug) ?? null
  );
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const activeCategory = resolveCategory(category);

  const posts: readonly BlogPost[] = activeCategory
    ? getPostsByCategory(activeCategory)
    : getAllPosts();

  const featuredPost = getFeaturedPost(posts);
  const gridPosts = featuredPost
    ? posts.filter((post) => post.slug !== featuredPost.slug)
    : posts;
  const mostPopular = getAllPosts().slice(0, 5);

  return (
    <div className="bg-surface">
      {/* ── Hero band ── */}
      <section
        aria-labelledby="blog-hero-heading"
        className="border-b border-brand-primary/10 bg-brand-primary-lighter/50"
      >
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <nav
            className="mb-6 flex items-center gap-2 text-sm text-neutral-500"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="transition-colors hover:text-brand-primary">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-neutral-900">Blog</span>
          </nav>

          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-primary">
              The TrueDeed Journal
            </p>
            <h1
              id="blog-hero-heading"
              className="font-heading text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl"
            >
              Property advice that moves you forward
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-neutral-600">
              Clear, expert guidance for every stage of your property
              journey — buying, renting, selling, letting, and investing across
              the UK.
            </p>
            <div className="mt-8 max-w-md">
              <NewsletterForm source="blog" />
              <p className="mt-2 text-xs text-neutral-500">
                One concise email a week. No spam, unsubscribe any time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* ── Featured + Most Popular ── */}
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {featuredPost ? (
            <article className="group relative overflow-hidden rounded-3xl border border-neutral-100 bg-neutral-900 shadow-sm">
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
              >
                <div className="relative aspect-[16/10] w-full sm:aspect-[16/9]">
                  <Image
                    src={featuredPost.heroImage}
                    alt={featuredPost.heroAlt}
                    width={1200}
                    height={675}
                    priority
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/35 to-transparent"
                    aria-hidden="true"
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
                  <span className="inline-block rounded-full bg-brand-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                    {featuredPost.category}
                  </span>
                  <h2 className="mt-4 max-w-2xl font-heading text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
                    {featuredPost.title}
                  </h2>
                  <p className="mt-3 hidden max-w-2xl text-base leading-relaxed text-white/80 sm:line-clamp-2 sm:block">
                    {featuredPost.excerpt}
                  </p>
                  <div className="mt-5 flex items-center gap-3 text-sm text-white/80">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white">
                      {featuredPost.author.initials}
                    </span>
                    <span className="font-medium text-white">
                      {featuredPost.author.name}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{featuredPost.dateLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{featuredPost.readTime}</span>
                  </div>
                </div>
              </Link>
            </article>
          ) : null}

          {/* Most Popular */}
          <aside aria-labelledby="most-popular-heading">
            <h2
              id="most-popular-heading"
              className="mb-5 font-heading text-lg font-bold text-neutral-900"
            >
              Most popular
            </h2>
            <ol className="flex flex-col divide-y divide-neutral-100 rounded-2xl border border-neutral-100 bg-white">
              {mostPopular.map((post, index) => (
                <li key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group flex items-start gap-4 p-4 transition-colors hover:bg-brand-primary-lighter/40"
                  >
                    <span
                      className="font-heading text-2xl font-bold text-brand-primary/30"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
                        {post.category}
                      </span>
                      <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-neutral-900 transition-colors group-hover:text-brand-primary">
                        {post.title}
                      </h3>
                      <span className="mt-1 block text-xs text-neutral-400">
                        {post.readTime}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </aside>
        </div>

        {/* ── Category filter pills ── */}
        <div className="mt-14 flex items-center gap-2 overflow-x-auto pb-2">
          <Link
            href="/blog"
            aria-current={activeCategory ? undefined : "page"}
            className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              activeCategory
                ? "border-neutral-200 bg-white text-neutral-700 hover:border-brand-primary hover:text-brand-primary"
                : "border-brand-primary bg-brand-primary text-white"
            }`}
          >
            All
          </Link>
          {BLOG_CATEGORIES.map((cat) => {
            const isActive = cat === activeCategory;
            return (
              <Link
                key={cat}
                href={`/blog?category=${categoryToSlug(cat)}`}
                aria-current={isActive ? "page" : undefined}
                className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-brand-primary bg-brand-primary text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-brand-primary hover:text-brand-primary"
                }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>

        {/* ── Insights grid ── */}
        <section aria-labelledby="insights-heading" className="mt-10">
          <h2
            id="insights-heading"
            className="mb-8 font-heading text-2xl font-bold text-neutral-900"
          >
            {activeCategory ? `${activeCategory} insights` : "Industry insights"}
          </h2>

          {gridPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gridPosts.map((post) => (
                <article
                  key={post.slug}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <Link
                    href={`/blog/${post.slug}`}
                    className="flex flex-1 flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
                      <Image
                        src={post.heroImage}
                        alt={post.heroAlt}
                        width={640}
                        height={400}
                        loading="lazy"
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <span className="mb-3 w-fit rounded-full bg-brand-primary-lighter px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-brand-primary">
                        {post.category}
                      </span>
                      <h3 className="mb-2 line-clamp-2 font-heading text-lg font-bold leading-snug text-neutral-900 transition-colors group-hover:text-brand-primary">
                        {post.title}
                      </h3>
                      <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-neutral-600">
                        {post.excerpt}
                      </p>
                      <div className="mt-auto flex items-center gap-2 border-t border-neutral-100 pt-3 text-xs text-neutral-500">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-primary-lighter text-xs font-bold text-brand-primary">
                          {post.author.initials}
                        </span>
                        <span className="truncate font-medium text-neutral-700">
                          {post.author.name}
                        </span>
                        <span aria-hidden="true" className="shrink-0">
                          ·
                        </span>
                        <span className="shrink-0">{post.dateLabel}</span>
                        <span aria-hidden="true" className="shrink-0">
                          ·
                        </span>
                        <span className="shrink-0">{post.readTime}</span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
              <h3 className="mb-2 font-heading text-xl font-bold text-neutral-900">
                No articles yet
              </h3>
              <p className="text-neutral-600">
                There are no{" "}
                {activeCategory ? activeCategory.toLowerCase() : ""} articles
                available right now. Try another category.
              </p>
            </div>
          )}
        </section>

        {/* ── CTA band ── */}
        <section
          aria-labelledby="cta-heading"
          className="mt-16 overflow-hidden rounded-3xl bg-brand-primary px-6 py-12 text-center sm:px-12 sm:py-16"
        >
          <h2
            id="cta-heading"
            className="font-heading text-3xl font-bold text-white sm:text-4xl"
          >
            Ready to make your next move?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/80">
            Search live listings, track sold prices, and get AI-backed insight
            on every property — all in one place.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-brand-primary transition-transform hover:-translate-y-0.5"
            >
              Start your search
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-white/40 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              See pricing
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
