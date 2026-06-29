import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, History, HeartHandshake, Star } from "lucide-react";

const REASONS = [
  {
    icon: BadgeCheck,
    title: "Vetted & Verified",
    body: "Every professional on TrueDeed undergoes a rigorous background check and ID verification before they can take work.",
  },
  {
    icon: History,
    title: "Real Reviews Only",
    body: "Read authentic feedback from real homeowners. Ratings come only from customers who hired through the platform.",
  },
  {
    icon: HeartHandshake,
    title: "Satisfaction Guarantee",
    body: "Your peace of mind is our priority. Quotes, messages and milestones stay in one place from start to finish.",
  },
] as const;

/**
 * "Why Choose TrueDeed" band: a tradesperson photo on the left with a floating
 * trust stat, three reasons on the right, and a "Post a Job Now" CTA.
 */
export function WhyChoose() {
  return (
    <section
      aria-labelledby="why-choose-heading"
      className="relative overflow-hidden bg-brand-primary-lighter py-24 dark:bg-slate-950"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_45%_at_0%_50%,rgba(45,122,95,0.08),transparent_70%)]"
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 md:grid-cols-2">
        {/* Photo + floating stat */}
        <div className="relative">
          <div className="aspect-square overflow-hidden rounded-3xl bg-brand-primary/10 shadow-xl shadow-brand-primary/10">
            <Image
              src="/marketplace/why-choose.webp"
              alt="A verified TrueDeed tradesperson at work in a bright workshop"
              width={1000}
              height={747}
              className="size-full object-cover"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </div>
          <div className="absolute -bottom-6 -right-2 rounded-2xl border border-border bg-white p-5 shadow-xl shadow-brand-primary/10 sm:-right-6 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-full bg-brand-primary text-base font-bold text-white">
                4.9
              </span>
              <div>
                <p className="flex items-center gap-1 font-heading text-sm font-bold text-brand-primary-dark dark:text-white">
                  <Star
                    className="size-4 fill-brand-gold text-brand-gold"
                    aria-hidden
                  />
                  Top-rated pros
                </p>
                <p className="text-xs text-muted-foreground">
                  Average customer rating
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reasons + CTA */}
        <div className="space-y-8">
          <h2
            id="why-choose-heading"
            className="font-heading text-3xl font-bold leading-tight tracking-tight text-brand-primary-dark dark:text-white sm:text-4xl"
          >
            Why Choose <span className="text-brand-primary-light">TrueDeed?</span>
          </h2>

          {REASONS.map((reason) => (
            <div key={reason.title} className="flex gap-5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary dark:text-brand-primary-light">
                <reason.icon className="size-6" aria-hidden />
              </span>
              <div>
                <h3 className="font-heading text-xl font-bold text-brand-primary-dark dark:text-white">
                  {reason.title}
                </h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {reason.body}
                </p>
              </div>
            </div>
          ))}

          <div className="pt-2">
            <Link
              href="/post-a-job"
              className="inline-flex items-center rounded-xl bg-brand-primary-dark px-8 py-3.5 font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            >
              Post a Job Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
