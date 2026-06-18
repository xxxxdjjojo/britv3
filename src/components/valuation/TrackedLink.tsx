"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackEvent } from "@/lib/analytics/track-event";

type Props = {
  href: string;
  event: string;
  properties?: Record<string, string | number | boolean | null | undefined>;
  className?: string;
  children: ReactNode;
};

/** A Next link that fires a privacy-safe analytics event on click. */
export function TrackedLink({ href, event, properties, className, children }: Props) {
  return (
    <Link href={href} className={className} onClick={() => trackEvent(event, properties)}>
      {children}
    </Link>
  );
}
