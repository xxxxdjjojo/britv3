import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import {
  BLOG_CATEGORIES,
  categoryToSlug,
  getPostsByCategory,
  type BlogCategory,
} from "@/content/blog";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams(): { slug: string }[] {
  return BLOG_CATEGORIES.map((category) => ({ slug: categoryToSlug(category) }));
}

function resolveCategory(slug: string): BlogCategory | undefined {
  return BLOG_CATEGORIES.find((category) => categoryToSlug(category) === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = resolveCategory(slug);

  if (!category) {
    return { title: "Category not found | TrueDeed Blog" };
  }

  return {
    title: `${category} | TrueDeed Blog`,
    description: `Articles and guides about ${category.toLowerCase()} on the TrueDeed blog.`,
    alternates: { canonical: `https://truedeed.co.uk/blog/category/${slug}` },
  };
}

export default async function BlogCategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = resolveCategory(slug);

  if (!category) {
    notFound();
  }

  const posts = getPostsByCategory(category);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <nav
        className="mb-8 flex items-center gap-2 text-sm text-neutral-500"
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
        <span className="font-medium text-neutral-900">{category}</span>
      </nav>

      <header className="mb-10 max-w-2xl">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
          {category}
        </h1>
        <p className="mt-3 text-lg text-neutral-600">
          Articles and guides about {category.toLowerCase()}.
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="text-lg font-medium text-neutral-700">
            No articles in this category yet
          </p>
          <Link
            href="/blog"
            className="mt-4 inline-block text-sm text-brand-primary underline-offset-4 hover:underline"
          >
            Browse all blog posts
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
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
                  <h2 className="mb-2 line-clamp-2 font-heading text-lg font-bold leading-snug text-neutral-900 transition-colors group-hover:text-brand-primary">
                    {post.title}
                  </h2>
                  <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-neutral-600">
                    {post.excerpt}
                  </p>
                  <div className="mt-auto flex items-center gap-2 border-t border-neutral-100 pt-3 text-xs text-neutral-500">
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
                    <span className="flex shrink-0 items-center gap-1">
                      <Clock className="size-3" />
                      {post.readTime}
                    </span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
