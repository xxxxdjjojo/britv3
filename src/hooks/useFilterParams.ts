"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";

/**
 * Syncs filter state to URL search params.
 * Params at their default value are omitted from the URL for cleanliness.
 * Uses router.replace (no history entry) with scroll: false.
 */
export function useFilterParams<T extends Record<string, string>>(
  defaults: T,
): [T, (key: keyof T, value: string) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const current = {} as T;
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const urlVal = searchParams.get(key as string);
    (current as Record<string, string>)[key as string] = urlVal ?? defaults[key];
  }

  const set = useCallback(
    (key: keyof T, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === defaults[key]) {
        params.delete(key as string);
      } else {
        params.set(key as string, value);
      }
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [searchParams, pathname, router, defaults, startTransition],
  );

  return [current, set];
}
