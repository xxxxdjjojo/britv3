"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CloudOff, RefreshCw, Search, Bookmark } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";

type SavedProperty = {
  id: string;
  title: string;
  location: string;
  price: string;
};

type RecentSearch = {
  label: string;
};

function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync browser online/offline state on mount
    setIsOnline(navigator.onLine);
    setSavedProperties(getFromStorage<SavedProperty[]>("brite:saved_properties", []));
    setRecentSearches(getFromStorage<RecentSearch[]>("brite:recent_searches", []));

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    await new Promise((r) => setTimeout(r, 400));
    if (navigator.onLine) {
      window.location.href = "/";
    } else {
      setIsOnline(false);
    }
    setRetrying(false);
  }, []);

  // Auto-redirect once back online
  useEffect(() => {
    if (isOnline) {
      const timer = setTimeout(() => {
        window.location.href = "/";
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-brand-primary/10 bg-white px-6 py-3">
        <Logo />
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 rounded-full px-3 py-1 ${
              isOnline
                ? "bg-success-light text-success"
                : "bg-brand-primary-lighter text-brand-primary"
            }`}
          >
            <CloudOff className="size-3.5" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {isOnline ? "Back Online" : "Offline"}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="flex flex-1 justify-center py-6 px-4 md:px-10">
        <div className="flex w-full max-w-3xl flex-col gap-8">

          {/* Offline hero */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-brand-primary/5 bg-white px-4 py-12 shadow-sm">
            <div className="relative mb-6">
              <CloudOff
                className="size-24 text-neutral-200"
                strokeWidth={1}
                aria-hidden="true"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="text-4xl font-bold text-brand-primary"
                  aria-hidden="true"
                >
                  ✕
                </span>
              </div>
            </div>
            <h1 className="font-heading text-2xl font-bold text-neutral-900">
              {isOnline ? "You're back online!" : "You're offline"}
            </h1>
            <p className="mt-2 max-w-xs text-center text-neutral-600">
              {isOnline
                ? "Redirecting you back to TrueDeed…"
                : "Check your internet connection and try again."}
            </p>
            {!isOnline && (
              <div className="mt-8 flex gap-3">
                <Button
                  onClick={handleRetry}
                  disabled={retrying}
                  size="lg"
                  className="min-w-40"
                >
                  {retrying ? (
                    <RefreshCw
                      className="mr-2 size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <RefreshCw className="mr-2 size-4" aria-hidden="true" />
                  )}
                  Retry Connection
                </Button>
              </div>
            )}
          </div>

          {/* Cached content */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-brand-primary/10 pb-2">
              <h2 className="font-heading text-xl font-bold text-neutral-900">
                Cached Content
              </h2>
              <span className="text-xs font-medium text-neutral-500">
                Available Offline
              </span>
            </div>

            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Search className="size-5 text-brand-primary" aria-hidden="true" />
                  <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-neutral-900">
                    Recent Searches
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg border border-brand-primary/10 bg-white px-3 py-2 shadow-sm"
                    >
                      <Search
                        className="size-4 text-neutral-400"
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium text-neutral-700">
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Saved properties */}
            {savedProperties.length > 0 ? (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Bookmark
                    className="size-5 text-brand-primary"
                    aria-hidden="true"
                  />
                  <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-neutral-900">
                    Saved Properties
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {savedProperties.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-stretch justify-between gap-4 rounded-xl border border-brand-primary/5 bg-white p-3 shadow-sm transition-all hover:border-brand-primary/20"
                    >
                      <div className="flex flex-1 flex-col justify-between py-1">
                        <div className="flex flex-col gap-1">
                          <p className="font-heading font-bold leading-tight text-neutral-900">
                            {p.title}
                          </p>
                          <p className="text-sm text-neutral-500">
                            {p.location} • {p.price}
                          </p>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <span className="flex items-center gap-1 rounded-lg border border-neutral-200 px-2 py-1 text-[10px] font-bold uppercase text-neutral-400">
                            <CloudOff className="size-3" aria-hidden="true" />
                            Cached
                          </span>
                        </div>
                      </div>
                      <div className="aspect-square w-28 shrink-0 rounded-lg bg-brand-primary-lighter md:w-32" />
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <div className="rounded-xl border border-dashed border-neutral-200 p-8 text-center text-neutral-400">
                <Bookmark
                  className="mx-auto mb-2 size-8 opacity-40"
                  aria-hidden="true"
                />
                <p className="text-sm">
                  No cached content available. Save properties to view them
                  offline.
                </p>
              </div>
            )}
          </div>

          {/* Help footer */}
          <div className="flex items-center justify-center gap-4 border-t border-brand-primary/10 py-6">
            <div className="flex items-center gap-2 text-neutral-500">
              <CloudOff className="size-4" aria-hidden="true" />
              <span className="text-xs">Offline Mode</span>
            </div>
            <div className="size-1 rounded-full bg-neutral-300" aria-hidden="true" />
            <Link
              href="/help"
              className="text-xs font-bold text-brand-primary hover:underline"
            >
              Help &amp; Support
            </Link>
          </div>
        </div>
      </main>

      {/* ── Mobile bottom nav ──────────────────────────────────── */}
      <nav
        className="sticky bottom-0 z-10 flex items-center justify-around border-t border-brand-primary/10 bg-white px-6 py-3"
        aria-label="Mobile navigation"
      >
        {(
          [
            { href: "/", label: "Home", icon: "🏠" },
            { href: "/search", label: "Search", icon: "🔍" },
            { href: "/dashboard/homebuyer/saved", label: "Saved", icon: "❤️" },
            { href: "/dashboard", label: "Profile", icon: "👤" },
          ] as const
        ).map(({ href, label, icon }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 text-neutral-400"
            aria-label={label}
          >
            <span className="text-xl" role="img" aria-hidden="true">
              {icon}
            </span>
            <span className="text-[10px] font-bold">{label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}
