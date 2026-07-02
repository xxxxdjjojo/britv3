"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { trackToolShared } from "@/lib/analytics/influence-events";

const COPIED_RESET_MS = 2000;

const noopSubscribe = () => () => {};
const getLocationHref = () => window.location.href;
const getServerHref = () => "";

/**
 * WhatsApp-first share row for tools and reports. Defaults the shared URL to
 * the current page when no explicit `url` is given.
 */
export function ShareBar({
  title,
  toolKey,
  url,
}: Readonly<{ title: string; toolKey: string; url?: string }>) {
  const [copied, setCopied] = useState(false);
  const pageUrl = useSyncExternalStore(noopSubscribe, getLocationHref, getServerHref);
  const copiedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimeout.current) clearTimeout(copiedTimeout.current);
    };
  }, []);

  const shareUrl = url ?? pageUrl;
  const whatsAppHref = `https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl}`.trim())}`;
  const mailtoHref = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
    `${title}\n\n${shareUrl}`.trim(),
  )}`;

  async function handleCopy() {
    trackToolShared(toolKey, "copy_link");
    const link = url ?? window.location.href;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      if (copiedTimeout.current) clearTimeout(copiedTimeout.current);
      copiedTimeout.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      // Clipboard unavailable (permissions / insecure context) — noop
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Share this">
      <a
        href={whatsAppHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        onClick={() => trackToolShared(toolKey, "whatsapp")}
        className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
      >
        Share on WhatsApp
      </a>
      <button
        type="button"
        aria-label="Copy link"
        onClick={handleCopy}
        className="inline-flex items-center gap-2 rounded-full border border-brand-primary px-4 py-2 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
      <a
        href={mailtoHref}
        aria-label="Email me this"
        onClick={() => trackToolShared(toolKey, "email")}
        className="inline-flex items-center gap-2 rounded-full border border-brand-primary px-4 py-2 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
      >
        Email me this
      </a>
    </div>
  );
}
