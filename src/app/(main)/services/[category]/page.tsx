import { redirect, notFound } from "next/navigation";
import { SLUG_TO_CATEGORY, CATEGORY_SLUGS } from "@/lib/providers/category-slugs";

type Params = { params: Promise<{ category: string }> };

export default async function ServiceCategoryRedirectPage({ params }: Params) {
  const { category } = await params;

  // Case 1: Plural URL slug (e.g. "plumbers" → "plumber")
  const fromSlug = SLUG_TO_CATEGORY[category];
  if (fromSlug) {
    redirect(`/services/tradespeople?category=${fromSlug}`);
  }

  // Case 2: Singular DB enum (e.g. "plumber" → already valid)
  if (category in CATEGORY_SLUGS) {
    redirect(`/services/tradespeople?category=${category}`);
  }

  notFound();
}
