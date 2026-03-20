"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Star, Sparkles } from "lucide-react";

type Property = Readonly<{
  id: number;
  slug: string;
  price: string;
  title: string;
  location: string;
  beds: number;
  baths: number;
  rating: number;
  match: number;
  image: string;
  alt: string;
}>;

export function PropertyCardGrid({ properties }: Readonly<{ properties: readonly Property[] }>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {properties.map((property) => (
        <Link
          key={property.id}
          href={`/properties/${property.slug}`}
          className="group flex flex-col gap-4"
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-100">
            <Image
              src={property.image}
              alt={property.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <Sparkles className="size-4 text-brand-primary" />
              <span className="text-xs font-bold text-brand-primary uppercase tracking-wide">
                {property.match}% Match
              </span>
            </div>
            <button
              className="absolute top-3 right-3 size-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
              aria-label="Save property"
              onClick={(e) => e.preventDefault()}
            >
              <Heart className="size-5" />
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-start">
              <h3 className="text-neutral-900 text-lg font-bold font-heading">
                {property.price}
              </h3>
              <div className="flex items-center gap-1 text-neutral-500 text-sm">
                <Star className="size-4 fill-brand-secondary text-brand-secondary" />
                <span>{property.rating}</span>
              </div>
            </div>
            <p className="text-neutral-700 font-medium truncate">
              {property.title}
            </p>
            <p className="text-neutral-500 text-sm truncate">
              {property.location}
            </p>
            <div className="flex gap-2 mt-1">
              <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-1 rounded-md">
                {property.beds} Bed
              </span>
              <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-1 rounded-md">
                {property.baths} Bath
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
