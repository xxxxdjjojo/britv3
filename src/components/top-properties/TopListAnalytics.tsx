"use client";

/**
 * Client-side analytics for the Top Properties surfaces. Server components
 * wrap their links in TrackedLinkArea (event on click, via delegation) and
 * pages mount TopListPageView (event on mount). trackEvent never throws.
 */

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track-event";

type EventProps = Record<string, string | number | boolean | null | undefined>;

export function TopListPageView({
  event,
  properties,
}: Readonly<{ event: string; properties?: EventProps }>) {
  useEffect(() => {
    trackEvent(event, properties);
    // Fire once per mount — properties are stable for a given page render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/**
 * Wraps server-rendered markup and reports clicks on any descendant link.
 * The anchor's data-analytics-* attributes become event properties, so the
 * server components stay server components.
 */
export function TrackedLinkArea({
  event,
  properties,
  children,
}: Readonly<{
  event: string;
  properties?: EventProps;
  children: React.ReactNode;
}>) {
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const anchor = (e.target as HTMLElement).closest("a");
    if (!anchor) return;
    trackEvent(event, {
      ...properties,
      href: anchor.getAttribute("href") ?? undefined,
      ...Object.fromEntries(
        Object.entries(anchor.dataset)
          .filter(([key]) => key.startsWith("analytics"))
          .map(([key, value]) => [
            key.replace(/^analytics/, "").toLowerCase(),
            value,
          ]),
      ),
    });
  }

  return <div onClick={handleClick}>{children}</div>;
}
