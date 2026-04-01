import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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
    title: `${title} | Blog | Britestate`,
    description: `Browse ${title.toLowerCase()} articles on the Britestate blog.`,
  };
}

export default async function BlogCategoryPage({ params }: Props) {
  const { slug } = await params;
  const categoryTitle = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  let posts: { id: string; title: string; slug: string; excerpt: string; created_at: string }[] = [];
  let fetchError = false;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cms_pages")
      .select("id, title, slug, excerpt, created_at")
      .eq("type", "blog")
      .eq("category", slug)
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    posts = data ?? [];
  } catch {
    fetchError = true;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold text-on-surface sm:text-5xl">
          {categoryTitle}
        </h1>
        <p className="mt-3 text-base text-[--color-on-surface-variant]">
          Articles and guides about {categoryTitle.toLowerCase()}.
        </p>
      </div>

      {fetchError || posts.length === 0 ? (
        <div className="mt-12 rounded-xl border border-[--color-outline-variant] p-8 text-center">
          <p className="text-lg font-medium text-on-surface">
            No posts in this category yet
          </p>
          <p className="mt-2 text-sm text-[--color-on-surface-variant]">
            Check back soon for new content.
          </p>
          <Link
            href="/blog"
            className="mt-4 inline-block text-sm text-brand-primary underline-offset-4 hover:underline"
          >
            Browse all blog posts
          </Link>
        </div>
      ) : (
        <div className="mt-12 space-y-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="block rounded-xl border border-[--color-outline-variant] p-6 transition-colors hover:border-[--color-outline-variant] hover:bg-[--color-surface-container-low]"
            >
              <h2 className="font-heading text-lg font-semibold text-on-surface">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="mt-2 text-sm text-[--color-on-surface-variant] line-clamp-2">
                  {post.excerpt}
                </p>
              )}
              <p className="mt-2 text-xs text-[--color-on-surface-variant]">
                {new Date(post.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
