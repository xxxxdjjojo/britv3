import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, Clock, ShieldCheck, Star, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RFQCreateForm } from "@/components/marketplace/RFQCreateForm";

export const metadata: Metadata = {
  title: "Post a Job — Get Free Quotes | Britestate",
  description:
    "Describe your job and get matched with verified tradespeople. Compare quotes and choose the best fit — free service.",
};

const STEPS = [
  { label: "1. Describe your job", description: "Tell us what you need done" },
  { label: "2. Get matched", description: "We find verified pros near you" },
  { label: "3. Compare & choose", description: "Pick the best quote for you" },
] as const;

const TRUST_SIGNALS = [
  {
    icon: ShieldCheck,
    title: "Verified professionals",
    description:
      "Every tradesperson is ID-verified, insured, and background-checked before joining the platform.",
  },
  {
    icon: Star,
    title: "Real reviews",
    description:
      "Thousands of verified reviews from homeowners just like you — no fake ratings.",
  },
  {
    icon: Clock,
    title: "Fast response",
    description:
      "Most jobs receive their first quote within 2 hours. Urgent jobs within 30 minutes.",
  },
  {
    icon: Users,
    title: "Up to 5 quotes",
    description:
      "Get multiple competitive quotes so you can compare prices and choose with confidence.",
  },
  {
    icon: CheckCircle,
    title: "100% free for homeowners",
    description:
      "Posting a job and receiving quotes is completely free. No hidden fees, ever.",
  },
] as const;

export default async function PostAJobPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-primary-dark to-brand-primary px-6 py-16 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-4xl font-heading font-extrabold tracking-tight">
            Post a Job — Get Free Quotes
          </h1>
          <p className="mb-8 text-xl text-white/80">
            Describe your job and get matched with up to 5 verified
            tradespeople. Compare quotes and choose the best fit.
          </p>

          {/* Process steps */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.label}
                className="rounded-xl bg-white/10 px-4 py-5 text-center backdrop-blur-sm"
              >
                <p className="text-base font-semibold">{step.label}</p>
                <p className="mt-1 text-sm text-white/70">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Form — left 2/3 */}
          <div className="lg:col-span-2">
            {isAuthenticated ? (
              <RFQCreateForm />
            ) : (
              <div className="space-y-4 rounded-lg border border-border bg-card p-6 text-center">
                <h2 className="text-lg font-semibold text-foreground">
                  Sign in to post a job
                </h2>
                <p className="text-sm text-muted-foreground">
                  Create a free account to post jobs and receive quotes from
                  verified tradespeople.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/login?callbackUrl=/post-a-job"
                    className="rounded-lg bg-brand-primary px-6 py-2.5 font-semibold text-white hover:bg-brand-primary-dark"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register?callbackUrl=/post-a-job"
                    className="rounded-lg border border-border px-6 py-2.5 font-semibold hover:border-brand-primary hover:text-brand-primary"
                  >
                    Create Account
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    href="/login?callbackUrl=/post-a-job"
                    className="text-brand-primary hover:underline"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            )}
          </div>

          {/* Trust sidebar — right 1/3 */}
          <aside className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Why Britestate?
            </h2>
            {TRUST_SIGNALS.map((signal) => {
              const Icon = signal.icon;
              return (
                <div
                  key={signal.title}
                  className="flex gap-3 rounded-lg border border-border bg-card p-4"
                >
                  <div className="mt-0.5 shrink-0">
                    <Icon className="size-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {signal.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {signal.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </aside>
        </div>
      </div>
    </div>
  );
}
