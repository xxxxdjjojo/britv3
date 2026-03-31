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
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-brand-primary/10 bg-card px-6 py-3">
        <Logo />
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 rounded-full px-3 py-1 font-body text-xs font-semibold uppercase tracking-wider ${
              isOnline
                ? "bg-brand-primary text-white"
                : "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
            }`}
          >
            <CloudOff className="size-3.5" aria-hidden="true" />
            <span>{isOnline ? "Back Online" : "Offline"}</span>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="flex flex-1 justify-center px-4 py-6 md:px-10">
        <div className="flex w-full max-w-3xl flex-col gap-8">

          {/* Offline hero */}
          <div className="flex flex-col items-center justify-center rounded-xl bg-card px-4 py-12 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
            <div className="mb-6 rounded-full bg-amber-100 p-6 dark:bg-amber-900/20">
              <CloudOff
                className="size-12 text-amber-600 dark:text-amber-400"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              {isOnline ? "You're back online!" : "You're offline"}
            </h1>
            <p className="mt-2 max-w-xs text-center font-body text-base text-neutral-500">
              {isOnline
                ? "Redirecting you back to Britestate…"
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
            <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2 dark:border-neutral-700/60">
              <h2 className="font-heading text-xl font-bold text-foreground">
                Cached Content
              </h2>
              <span className="font-body text-xs font-medium text-neutral-500">
                Available Offline
              </span>
            </div>

            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Search className="size-5 text-brand-primary" aria-hidden="true" />
                  <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">
                    Recent Searches
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60"
                    >
                      <Search
                        className="size-4 text-neutral-400"
                        aria-hidden="true"
                      />
                      <span className="font-body text-sm font-medium text-foreground">
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
                  <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">
                    Saved Properties
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {savedProperties.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-stretch justify-between gap-4 rounded-xl bg-card p-3 shadow-sm ring-1 ring-neutral-200/60 transition-shadow hover:shadow-md dark:ring-neutral-700/60"
                    >
                      <div className="flex flex-1 flex-col justify-between py-1">
                        <div className="flex flex-col gap-1">
                          <p className="font-heading font-bold leading-tight text-foreground">
                            {p.title}
                          </p>
                          <p className="font-body text-sm text-neutral-500">
                            {p.location} • {p.price}
                          </p>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <span className="flex items-center gap-1 rounded-lg border border-neutral-200/60 px-2 py-1 font-body text-[10px] font-semibold uppercase text-neutral-400 dark:border-neutral-700/60">
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
              <div className="rounded-xl border border-dashed border-neutral-200/60 p-8 text-center dark:border-neutral-700/60">
                <Bookmark
                  className="mx-auto mb-2 size-8 text-neutral-300 dark:text-neutral-600"
                  aria-hidden="true"
                />
                <p className="font-body text-sm text-neutral-500">
                  No cached content available. Save properties to view them
                  offline.
                </p>
              </div>
            )}
          </div>

          {/* Help footer */}
          <div className="flex items-center justify-center gap-4 border-t border-neutral-200/60 py-6 dark:border-neutral-700/60">
            <div className="flex items-center gap-2 text-neutral-500">
              <CloudOff className="size-4" aria-hidden="true" />
              <span className="font-body text-xs">Offline Mode</span>
            </div>
            <div className="size-1 rounded-full bg-neutral-300 dark:bg-neutral-600" aria-hidden="true" />
            <Link
              href="/help"
              className="font-body text-xs font-semibold text-brand-primary hover:underline"
            >
              Help &amp; Support
            </Link>
          </div>
        </div>
      </main>

      {/* ── Mobile bottom nav ──────────────────────────────────── */}
      <nav
        className="sticky bottom-0 z-10 flex items-center justify-around border-t border-neutral-200/60 bg-card px-6 py-3 dark:border-neutral-700/60"
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
            <span className="font-body text-[10px] font-semibold">{label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}
