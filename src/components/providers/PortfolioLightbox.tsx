"use client";

/**
 * PortfolioLightbox — Client Component
 *
 * Wraps a portfolio image item in a Dialog trigger. When clicked, opens
 * a full-size image lightbox using the Shadcn Dialog primitive.
 */

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PortfolioItem } from "@/types/providers";

type PortfolioLightboxProps = Readonly<{
  item: PortfolioItem;
}>;

export function PortfolioLightbox({ item }: PortfolioLightboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="w-full text-left [break-inside:avoid] mb-4 relative group cursor-pointer rounded-xl overflow-hidden"
        onClick={() => setOpen(true)}
        aria-label={`View ${item.title}`}
      >
        <Image
          src={item.image_url}
          alt={item.title}
          width={800}
          height={600}
          className="w-full object-cover rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 group-hover:scale-105 transition-transform duration-300"
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <p className="font-semibold text-sm truncate">{item.title}</p>
            {item.category && (
              <p className="text-xs text-white/70">{item.category}</p>
            )}
          </div>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl p-2">
          <DialogTitle className="sr-only">{item.title}</DialogTitle>
          <div className="relative w-full overflow-hidden rounded-lg">
            <Image
              src={item.image_url}
              alt={item.title}
              width={1200}
              height={900}
              className="w-full h-auto object-contain"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
            />
          </div>
          {(item.title || item.description || item.category) && (
            <div className="px-4 pb-2 pt-1">
              <p className="font-semibold text-slate-900 dark:text-white text-sm">
                {item.title}
              </p>
              {item.category && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.category}
                </p>
              )}
              {item.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
