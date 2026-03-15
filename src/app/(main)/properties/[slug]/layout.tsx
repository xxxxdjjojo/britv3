export default async function PropertyDetailLayout(
  props: Readonly<{
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
  }>,
) {
  const { slug } = await props.params;

  // Layout is transparent pass-through for now.
  // The (main) layout handles header/footer/providers.
  // This layout exists so we can add property-specific metadata/providers later
  // without modifying page.tsx (which is working mock content for Wave 2).
  return <>{props.children}</>;
}
