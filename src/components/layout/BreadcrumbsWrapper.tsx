"use client";

import { usePathname } from "next/navigation";
import { Breadcrumbs } from "./Breadcrumbs";

/**
 * Client wrapper that passes the current pathname to the server-style
 * Breadcrumbs component. Used in (main)/layout.tsx where pathname
 * is not available to Server Components.
 */
export function BreadcrumbsWrapper() {
  const pathname = usePathname();
  return <Breadcrumbs pathname={pathname} />;
}
