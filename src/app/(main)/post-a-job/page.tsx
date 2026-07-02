import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle,
  Clock,
  Lightbulb,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RFQCreateForm } from "@/components/marketplace/RFQCreateForm";
import { CATEGORY_LABELS } from "@/lib/marketplace/category-labels";
import type { ServiceCategory } from "@/types/marketplace";

export const metadata: Metadata = {
  title: "Post a Job — Get Free Quotes | TrueDeed",
  description:
    "Describe your job and get matched with verified tradespeople. Compare quotes and choose the best fit — free service.",
};

const STEPS = [
  {
    step: "1",
    label: "Describe",
    description: "Tell us what you need done",
    active: true,
  },
  {
    step: "2",
    label: "Get matched",
    description: "We find verified pros near you",
    active: false,
  },
  {
    step: "3",
    label: "Compare",
    description: "Pick the best quote for you",
    active: false,
  },
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

/** Returns the value only if it is a real service category enum key. */
function validCategory(service: string | undefined): ServiceCategory | undefined {
  return service && service in CATEGORY_LABELS
    ? (service as ServiceCategory)
    : undefined;
}

type SearchParams = Promise<{ service?: string; postcode?: string }>;

export default async function PostAJobPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { service, postcode } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen bg-[#f6f8f7]">
      <main className="mx-auto max-w-7xl px-4 py-8 lg:py-12">
        <div className="grid grid-cols-12 gap-8">
          {/* Left — wizard */}
          <div className="col-span-12 lg:col-span-8">
            {/* Progress stepper */}
            <div className="mb-10">
              <div className="flex items-start justify-between">
                {STEPS.map((step, index) => (
                  <div key={step.step} className="contents">
                    <div className="flex flex-1 flex-col items-center text-center">
                      <div
                        className={
                          step.active
                            ? "mb-2 flex size-10 items-center justify-center rounded-full bg-brand-primary font-bold text-white"
                            : "mb-2 flex size-10 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-500"
                        }
                      >
                        {step.step}
                      </div>
                      <span
                        className={
                          step.active
                            ? "text-xs font-semibold uppercase tracking-wider text-brand-primary"
                            : "text-xs font-semibold uppercase tracking-wider text-slate-400"
                        }
                      >
                        {step.label}
                      </span>
                      <span className="mt-0.5 hidden text-xs text-slate-400 sm:block">
                        {step.description}
                      </span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={
                          step.active
                            ? "mt-5 h-0.5 flex-1 bg-brand-primary/30"
                            : "mt-5 h-0.5 flex-1 bg-slate-200"
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form card / sign-in prompt */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="p-6 sm:p-8 lg:p-10">
                {isAuthenticated ? (
                  <>
                    <h1 className="mb-2 text-2xl font-bold text-slate-900">
                      Tell us about your project
                    </h1>
                    <p className="mb-8 text-slate-500">
                      Provide as much detail as possible to get the most
                      accurate quotes from professionals.
                    </p>
                    <RFQCreateForm
                      defaultCategory={validCategory(service)}
                      defaultPostcode={postcode}
                      className="rounded-none border-0 p-0 shadow-none"
                    />
                  </>
                ) : (
                  <div className="space-y-4 text-center">
                    <h1 className="text-2xl font-bold text-slate-900">
                      Sign in to post a job
                    </h1>
                    <p className="text-sm text-slate-500">
                      Create a free account to post jobs and receive quotes from
                      verified tradespeople.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                      <Link
                        href="/login?callbackUrl=/post-a-job"
                        className="rounded-lg bg-brand-primary px-8 py-3 font-bold text-white shadow-md shadow-brand-primary/20 transition-all hover:bg-brand-primary-dark"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register?callbackUrl=/post-a-job"
                        className="rounded-lg border border-slate-200 px-8 py-3 font-semibold text-slate-700 transition-colors hover:border-brand-primary hover:text-brand-primary"
                      >
                        Create Account
                      </Link>
                    </div>
                    <p className="text-xs text-slate-400">
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
            </div>
          </div>

          {/* Right — tips & trust */}
          <aside className="col-span-12 space-y-6 lg:col-span-4">
            {/* Pro tip */}
            <div className="rounded-xl border border-brand-primary/20 bg-brand-primary-lighter p-6">
              <div className="mb-4 flex items-center gap-4">
                <div className="rounded-lg bg-brand-primary p-2 text-white">
                  <Lightbulb className="size-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Pro tip</h2>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-slate-600">
                Jobs with clear photos and detailed descriptions receive more
                quotes from highly-rated professionals.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-xs text-slate-500">
                  <CheckCircle className="size-4 shrink-0 text-brand-primary" />
                  Mention if materials are already purchased.
                </li>
                <li className="flex items-start gap-2 text-xs text-slate-500">
                  <CheckCircle className="size-4 shrink-0 text-brand-primary" />
                  Specify if there is parking available.
                </li>
              </ul>
            </div>

            {/* Why TrueDeed */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 font-bold text-slate-900">Why TrueDeed?</h2>
              <div className="space-y-4">
                {TRUST_SIGNALS.map((signal) => {
                  const Icon = signal.icon;
                  return (
                    <div key={signal.title} className="flex gap-4">
                      <Icon className="size-5 shrink-0 text-brand-primary" />
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          {signal.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {signal.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
