import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { getSafePublicVouchedProfile } from "@/services/referrals/public-vouched-profile";

export default async function PublicVouchedPage({ params }: Readonly<{
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;
  const profile = await getSafePublicVouchedProfile(slug);
  if (!profile) notFound();

  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <section className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
          <BadgeCheck aria-hidden="true" className="size-7" />
        </div>
        <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-emerald-700">TrueDeed 3+3 vouched</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
          {profile.businessName}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-neutral-600">
          Three eligible providers and three verified clients have vouched for this business.
          Names appear only where each person chose public attribution.
        </p>

        {profile.attributions.length > 0 && (
          <ul aria-label="Consented vouches" className="mt-8 grid gap-3 sm:grid-cols-2">
            {profile.attributions.map((attribution) => (
              <li
                key={`${attribution.firstName}-${attribution.role}-${attribution.acceptedAt}`}
                className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
              >
                <p className="font-semibold text-neutral-900">{attribution.firstName}</p>
                <p className="mt-1 text-sm text-neutral-600">{attribution.role}</p>
                <p className="mt-2 text-xs text-neutral-500">
                  Accepted <time dateTime={attribution.acceptedAt}>{new Date(attribution.acceptedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}</time>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link className="mt-8 inline-flex min-h-11 w-fit items-center rounded-lg border border-neutral-300 px-5 py-3 font-semibold text-neutral-900" href="/services">
        Browse verified professionals
      </Link>
    </main>
  );
}
