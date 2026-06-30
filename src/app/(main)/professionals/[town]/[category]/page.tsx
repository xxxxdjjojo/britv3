import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, User } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { categoryFromSlug, categoryLabel, townFromSlug } from "@/lib/placements/category-slugs";
import { FeaturedExperts } from "@/components/placements/FeaturedExperts";
import { listAreaProviders } from "@/services/placements/area-directory-service";

export const dynamic = "force-dynamic";

type Params = { town: string; category: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { town, category } = await params;
  const cat = categoryFromSlug(category);
  if (!cat) return { title: "Local professionals | TrueDeed" };
  const townName = townFromSlug(town);
  const label = categoryLabel(cat);
  return {
    title: `${label} in ${townName} — Verified Local Experts | TrueDeed`,
    description: `Find trusted, verified ${label.toLowerCase()} serving ${townName}. Compare ratings, response times and request quotes on TrueDeed.`,
    alternates: { canonical: `/professionals/${town}/${category}` },
  };
}

export default async function AreaProfessionalsPage({ params }: { params: Promise<Params> }) {
  const { town, category } = await params;
  const cat = categoryFromSlug(category);
  if (!cat) notFound();

  const townName = townFromSlug(town);
  const label = categoryLabel(cat);

  const supabase = await createClient();
  const providers = await listAreaProviders(supabase, cat, 12);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
        <Link href="/professionals" className="hover:underline">
          Professionals
        </Link>
        <span className="mx-1">/</span>
        <span>{townName}</span>
        <span className="mx-1">/</span>
        <span className="text-foreground">{label}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {label} in {townName}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Verified, reviewed {label.toLowerCase()} serving {townName} and the surrounding area. Compare ratings and
          response times, then request a quote — all without leaving TrueDeed.
        </p>
      </header>

      <div className="mb-10">
        <FeaturedExperts
          zone="area_page"
          heading={`Featured ${label.toLowerCase()} in ${townName}`}
          subheading="Recommended local experts for this area"
          town={townName}
          categories={[cat]}
          limit={3}
          variant="band"
        />
      </div>

      <section aria-labelledby="directory-heading">
        <h2 id="directory-heading" className="mb-4 text-lg font-semibold text-foreground">
          All verified {label.toLowerCase()}
        </h2>
        {providers.length === 0 ? (
          <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
            We&apos;re still adding verified {label.toLowerCase()} for {townName}.{" "}
            <Link href="/services" className="font-medium text-[color:var(--color-brand-primary,#1B4D3E)] hover:underline">
              Browse the full marketplace
            </Link>
            .
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
              <li key={p.userId}>
                <Link
                  href={`/services/tradespeople/${p.slug}`}
                  className="flex items-start gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
                >
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {p.avatarUrl ? (
                      <Image src={p.avatarUrl} alt={`${p.businessName} logo`} fill className="object-cover" sizes="44px" />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <User className="size-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{p.businessName}</p>
                    <p className="text-xs text-muted-foreground">{label.replace(/s$/, "")}</p>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs">
                      <Star
                        className="size-3"
                        style={{ color: "var(--color-brand-secondary, #A07D2E)", fill: "var(--color-brand-secondary, #A07D2E)" }}
                      />
                      <span className="font-medium text-foreground">
                        {p.averageRating == null ? "New" : p.averageRating.toFixed(1)}
                      </span>
                      {p.totalReviews > 0 && <span className="text-muted-foreground">({p.totalReviews})</span>}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-10 rounded-xl border border-dashed bg-muted/30 p-4 text-xs text-muted-foreground">
        Are you a {label.replace(/s$/, "").toLowerCase()} serving {townName}?{" "}
        <Link href="/dashboard/provider/boost" className="font-medium text-[color:var(--color-brand-primary,#1B4D3E)] hover:underline">
          Feature your business here
        </Link>
        .
      </p>
    </main>
  );
}
