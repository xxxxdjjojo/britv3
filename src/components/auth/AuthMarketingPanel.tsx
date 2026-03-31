"use client";

import { useEffect, useState } from "react";

const TESTIMONIALS = [
  {
    name: "Sarah Mitchell",
    role: "First-time Buyer",
    quote:
      "Found my dream home in just 3 weeks. The search tools are incredible.",
  },
  {
    name: "James Okafor",
    role: "Landlord",
    quote:
      "Managing my portfolio has never been easier. The compliance tools alone saved me hours.",
  },
  {
    name: "Emma Clarke",
    role: "Estate Agent",
    quote:
      "My listings get 3x more views than on any other portal. Highly recommend.",
  },
];

const TRUST_STATS = [
  { label: "25k+ Properties" },
  { label: "5k+ Verified Pros" },
  { label: "4.8★ Rating" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const VALUE_PROPS = [
  { icon: "✓", text: "Verified listings only" },
  { icon: "✓", text: "Book viewings in 4 clicks" },
  { icon: "✓", text: "All roles, one platform" },
];

export function AuthMarketingPanel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
        setFading(false);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const testimonial = TESTIMONIALS[activeIndex];

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-brand-primary">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-primary/90 to-brand-primary/70" />

      {/* Radial glow accent */}
      <div className="absolute inset-0 opacity-25" aria-hidden="true">
        <div className="absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-secondary blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-10 px-10 py-16">
        {/* Headline */}
        <div className="text-center">
          <h2 className="font-heading text-4xl font-bold leading-tight text-white">
            The smarter way<br />to move
          </h2>
          <p className="mt-3 font-sans text-sm text-white/70">
            Trusted by thousands across the UK
          </p>

          {/* Value props */}
          <ul className="mt-5 space-y-2" aria-label="Platform highlights">
            {VALUE_PROPS.map((prop) => (
              <li key={prop.text} className="flex items-center justify-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-white/20 text-xs text-white font-bold" aria-hidden="true">
                  {prop.icon}
                </span>
                <span className="font-sans text-sm text-white/80">{prop.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Testimonial card — glassmorphism */}
        <div
          className="w-full rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-md shadow-xl transition-opacity duration-300"
          style={{ opacity: fading ? 0 : 1 }}
          aria-live="polite"
          aria-label={`Testimonial from ${testimonial.name}`}
        >
          <p className="font-sans text-base italic leading-relaxed text-white/90">
            &ldquo;{testimonial.quote}&rdquo;
          </p>
          <div className="mt-5 flex items-center gap-3">
            {/* Avatar */}
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/20 border border-white/20">
              <span className="font-heading text-sm font-bold text-white">
                {getInitials(testimonial.name)}
              </span>
            </div>
            <div>
              <p className="font-heading text-sm font-semibold text-white">
                {testimonial.name}
              </p>
              <p className="font-sans text-xs text-white/60">
                {testimonial.role}
              </p>
            </div>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex gap-2" role="tablist" aria-label="Testimonial navigation">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`View testimonial ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "w-6 bg-brand-secondary"
                  : "w-1.5 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>

        {/* Trust stats */}
        <div className="flex flex-wrap justify-center gap-2">
          {TRUST_STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm"
            >
              <span className="font-sans text-sm font-medium text-white">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Keep old export name for backwards compatibility
export { AuthMarketingPanel as RightPanelContent };
