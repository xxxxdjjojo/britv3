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

export function RightPanelContent() {
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
    <div className="relative flex h-full min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-[#1B4D3E]">
      {/* CSS gradient background — no image file required */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1B4D3E] via-[#1a4538] to-[#0d2b22]" />

      {/* Decorative radial glow */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4A853] blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-10 px-10 py-16">
        {/* Headline */}
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold leading-tight text-white">
            The smarter way to move
          </h2>
          <p className="mt-2 font-body text-sm text-white/70">
            Trusted by thousands across the UK
          </p>
        </div>

        {/* Testimonial card */}
        <div
          className="w-full rounded-2xl bg-white p-6 shadow-xl transition-opacity duration-300"
          style={{ opacity: fading ? 0 : 1 }}
        >
          <p className="font-body text-base italic leading-relaxed text-neutral-700">
            &ldquo;{testimonial.quote}&rdquo;
          </p>
          <div className="mt-5 flex items-center gap-3">
            {/* Avatar circle */}
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1B4D3E]">
              <span className="font-heading text-sm font-bold text-white">
                {getInitials(testimonial.name)}
              </span>
            </div>
            <div>
              <p className="font-heading text-sm font-semibold text-neutral-900">
                {testimonial.name}
              </p>
              <p className="font-body text-xs text-neutral-500">
                {testimonial.role}
              </p>
            </div>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`View testimonial ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "w-6 bg-[#D4A853]"
                  : "w-1.5 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>

        {/* Trust stats */}
        <div className="flex flex-wrap justify-center gap-3">
          {TRUST_STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm"
            >
              <span className="font-body text-sm font-medium text-white">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
