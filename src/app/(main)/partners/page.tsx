import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { SafeHTML } from "@/components/ui/SafeHTML";

export const metadata: Metadata = {
  title: "Partners | Britestate",
  description:
    "Partner with Britestate to reach millions of UK property seekers. Learn about our partnership programmes.",
};

export default async function PartnersPage() {
  let content: { title: string; content: string } | null = null;
  let fetchError = false;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cms_pages")
      .select("title, content")
      .eq("type", "page")
      .eq("slug", "partners")
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
          Partner With Us
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
          Join the Britestate partner programme and connect your services with
          millions of UK property seekers.
        </p>
      </div>

      {fetchError || !content ? (
        <div className="mt-12 rounded-xl border border-neutral-200 p-8 text-center">
          <h2 className="font-heading text-xl font-semibold text-neutral-900">
            Coming Soon
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            Our partner programme details are being finalised. Get in touch to
            learn about early-access opportunities.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <SafeHTML html={content.content} className="prose prose-neutral mt-12 max-w-none" />
        </>
      )}
    </div>
  );
}
