import type { Metadata } from "next";
import DOMPurify from "isomorphic-dompurify";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Investor Relations | Britestate",
  description:
    "Key metrics, financials, and investor information for Britestate.",
};

export default async function InvestorsPage() {
  let content: { title: string; content: string } | null = null;
  let fetchError = false;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cms_pages")
      .select("title, content")
      .eq("type", "page")
      .eq("slug", "investors")
      .eq("published", true)
      .single();

    if (error) throw error;
    content = data;
  } catch {
    fetchError = true;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      {/* Hero */}
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold text-neutral-900 sm:text-5xl">
          Investor Relations
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
          Building the all-in-one platform for UK property transactions.
        </p>
      </div>

      {fetchError || !content ? (
        <>
          {/* Placeholder Metrics */}
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              { label: "Registered Users", value: "--" },
              { label: "Properties Listed", value: "--" },
              { label: "Platform GMV", value: "--" },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-neutral-200 p-6 text-center"
              >
                <p className="text-3xl font-bold text-neutral-900">
                  {metric.value}
                </p>
                <p className="mt-1 text-sm text-neutral-500">{metric.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-xl border border-neutral-200 p-8 text-center">
            <h2 className="font-heading text-xl font-semibold text-neutral-900">
              Coming Soon
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              Detailed investor information, key metrics, and financial reports
              will be available here. For investor enquiries, please get in
              touch.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div
            className="prose prose-neutral mt-12 max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.content) }}
          />
        </>
      )}
    </div>
  );
}
