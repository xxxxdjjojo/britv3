import type { ReactNode } from "react";

export default function PropertyDetailLayout(
  props: Readonly<{ children: ReactNode }>
) {
  // Layout is transparent pass-through for now.
  // The (main) layout handles header/footer/providers.
  // This layout exists so we can add property-specific metadata/providers later
  // without modifying page.tsx (which is working mock content for Wave 2).
  return <>{props.children}</>;
}
