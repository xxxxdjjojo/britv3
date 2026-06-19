import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Press | TrueDeed",
  description:
    "Press releases, media resources, and the latest news from TrueDeed.",
};

export default async function PressPage() {
  let releases: { id: string; title: string; slug: string; excerpt: string; created_at: string }[] = [];
  let fetchError = false;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cms_pages")
      .select("id, title, slug, excerpt, created_at")
      .eq("type", "press")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    releases = data ?? [];
  } catch {
    fetchError = true;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      {/* Hero */}
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold text-neutral-900 sm:text-5xl">
          Press
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
          The latest news, announcements, and media resources from TrueDeed.
        </p>
      </div>

      {fetchError || releases.length === 0 ? (
        <div className="mt-12 rounded-xl border border-neutral-200 p-8 text-center">
          <h2 className="font-heading text-xl font-semibold text-neutral-900">
            Coming Soon
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            Our press page is being prepared. In the meantime, please reach out
            to our team for any media enquiries.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-block text-sm text-brand-primary underline-offset-4 hover:underline"
          >
            Contact Us
          </Link>
        </div>
      ) : (
        <div className="mt-12 space-y-6">
          {releases.map((release) => (
            <div
              key={release.id}
              className="rounded-xl border border-neutral-200 p-6"
            >
              <p className="text-xs text-neutral-400">
                {new Date(release.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <h2 className="mt-1 font-heading text-lg font-semibold text-neutral-900">
                {release.title}
              </h2>
              {release.excerpt && (
                <p className="mt-2 text-sm text-neutral-500 line-clamp-2">
                  {release.excerpt}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
