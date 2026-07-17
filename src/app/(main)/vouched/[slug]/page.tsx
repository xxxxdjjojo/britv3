import Link from "next/link";
import { notFound } from "next/navigation";
import { getSafePublicVouchedProfile } from "@/services/referrals/public-vouched-profile";
import { PublicVouchedCard } from "@/components/referrals/PublicVouchedCard";

export default async function PublicVouchedPage({ params }: Readonly<{
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;
  const profile = await getSafePublicVouchedProfile(slug);
  if (!profile) notFound();

  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <PublicVouchedCard profile={profile} />

      <Link className="mt-8 inline-flex min-h-11 w-fit items-center rounded-lg border border-neutral-300 px-5 py-3 font-semibold text-neutral-900" href="/services">
        Browse verified professionals
      </Link>
    </main>
  );
}
