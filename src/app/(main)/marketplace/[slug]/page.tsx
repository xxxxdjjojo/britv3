import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientRedirect } from "./ClientRedirect";

type PageParams = {
  params: Promise<{ slug: string }>;
};

async function getProvider(slug: string) {
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
    return { title: "Provider Not Found | TrueDeed" };
  }
  return {
    title: `${provider.business_name} | TrueDeed Marketplace`,
    description: provider.business_description ?? `View ${provider.business_name} on TrueDeed Marketplace`,
  };
}

export default async function ProviderProfileRedirect({ params }: PageParams) {
  const { slug } = await params;
  const provider = await getProvider(slug);

  if (!provider) {
    notFound();
  }

  const category = provider.services?.[0] ?? "other";
  const targetPath = `/services/${category}/${slug}`;

  return <ClientRedirect targetPath={targetPath} />;
}
