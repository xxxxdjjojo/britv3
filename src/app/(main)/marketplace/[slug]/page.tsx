import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

type PageParams = {
  params: Promise<{ slug: string }>;
};

async function getProvider(slug: string) {
  // Server-side fetch to internal API
  // In production this would use createClient() directly
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/providers/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const provider = await getProvider(slug);
  if (!provider) {
    return { title: "Provider Not Found | Britestate" };
  }
  return {
    title: `${provider.business_name} | Britestate Marketplace`,
    description: provider.business_description ?? `View ${provider.business_name} on Britestate Marketplace`,
  };
}

export default async function ProviderProfilePage({ params }: PageParams) {
  const { slug } = await params;
  const provider = await getProvider(slug);

  if (!provider) {
    notFound();
  }

  const category: string =
    Array.isArray(provider.services) && provider.services.length > 0
      ? (provider.services[0] as string)
      : "other";

  redirect(`/services/${category}/${slug}`);
}
