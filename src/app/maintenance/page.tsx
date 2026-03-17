"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Construction,
  Clock,
  Wrench,
  CheckCircle2,
  Twitter,
  Linkedin,
  Mail,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MaintenancePage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    // Simulate subscription — wire to real endpoint when available
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-brand-primary/10 bg-white px-6 py-6 md:px-20">
        <Logo />
        <div className="hidden items-center gap-4 md:flex">
          <span className="rounded-full border border-brand-primary/10 bg-brand-primary-lighter px-4 py-1.5 text-sm font-medium text-brand-primary">
            Status: Maintenance
          </span>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="flex w-full max-w-3xl flex-col items-center text-center">

          {/* Illustration */}
          <div className="mb-8 w-full max-w-md">
            <div className="relative aspect-video overflow-hidden rounded-xl border border-brand-primary/10 bg-brand-primary-lighter/50 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-transparent" />
              <div className="relative flex flex-col items-center gap-4">
                <Construction
                  className="size-20 text-brand-primary opacity-80"
                  aria-hidden="true"
                />
                <div className="flex gap-4">
                  <Wrench
                    className="size-10 text-brand-primary/40"
                    aria-hidden="true"
                  />
                  <svg
                    className="size-10 text-brand-primary/40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  >
                    <path d="M3 3h18v18H3z" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                  <Wrench
                    className="size-10 text-brand-primary/40 -scale-x-100"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-10 flex flex-col gap-4">
            <h1 className="font-heading text-4xl font-black tracking-tight text-neutral-900 md:text-6xl">
              We&apos;ll be right back
            </h1>
            <p className="mx-auto max-w-lg text-lg leading-relaxed text-neutral-600 md:text-xl">
              Britestate is currently undergoing scheduled maintenance. We&apos;re
              working hard to improve your property experience.
            </p>
          </div>

          {/* Info cards */}
          <div className="mb-12 grid w-full max-w-xl grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-xl border border-brand-primary/10 bg-white p-6 shadow-sm">
              <Clock
                className="mb-2 size-5 text-brand-primary"
                aria-hidden="true"
              />
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Estimated Return
              </p>
              <p className="font-heading text-3xl font-bold text-brand-primary">
                2 Hours
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-brand-primary/10 bg-white p-6 shadow-sm">
              <Wrench
                className="mb-2 size-5 text-brand-primary"
                aria-hidden="true"
              />
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Current Phase
              </p>
              <p className="font-heading text-3xl font-bold text-brand-primary">
                Database Opt.
              </p>
            </div>
          </div>

          {/* Subscribe form */}
          <div className="w-full max-w-md rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-md">
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle2
                  className="size-10 text-success"
                  aria-hidden="true"
                />
                <p className="font-heading font-semibold text-neutral-900">
                  You&apos;re on the list!
                </p>
                <p className="text-sm text-neutral-500">
                  We&apos;ll ping you once at {email} when we&apos;re live.
                </p>
              </div>
            ) : (
              <>
                <h2 className="mb-4 font-heading text-lg font-bold text-neutral-900">
                  Subscribe to updates
                </h2>
                <form
                  onSubmit={handleSubscribe}
                  className="flex flex-col gap-2 md:flex-row"
                >
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1"
                    aria-label="Email address"
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="shrink-0"
                  >
                    {loading ? "Saving…" : "Notify Me"}
                  </Button>
                </form>
                <p className="mt-3 text-sm text-neutral-500">
                  We&apos;ll send you a single ping when we&apos;re live again.
                </p>
              </>
            )}
          </div>

          {/* Social links */}
          <div className="mt-12 flex flex-col items-center gap-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Follow our progress
            </p>
            <div className="flex gap-5">
              {(
                [
                  { href: "#", Icon: Twitter, label: "Twitter" },
                  { href: "#", Icon: Linkedin, label: "LinkedIn" },
                  { href: "#", Icon: Mail, label: "Email" },
                ] as const
              ).map(({ href, Icon, label }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex size-10 items-center justify-center rounded-full bg-brand-primary-lighter text-brand-primary transition-all hover:bg-brand-primary hover:text-white"
                >
                  <Icon className="size-5" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-brand-primary/5 py-10 text-center">
        <p className="text-sm text-neutral-400">
          © 2026 Britestate Real Estate Services. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
