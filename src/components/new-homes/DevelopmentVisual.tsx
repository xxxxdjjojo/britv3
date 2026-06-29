import Image from "next/image";
import { cn } from "@/lib/utils";

// New-build developments rarely ship with a hosted hero image in the pilot, so
// we render a branded gradient keyed to the developer's colour. When a real
// Supabase-hosted asset exists we use next/image (only supabase.co is allowed
// in next.config remotePatterns).
// TODO: when developers upload real CGIs/photography, widen remotePatterns and
// route all hero media through next/image.

function isSupabaseAsset(url: string | null): boolean {
  return !!url && url.includes("supabase.co");
}

export function DevelopmentVisual({
  imageUrl,
  brandColour,
  name,
  className,
  sizes,
  priority,
}: Readonly<{
  imageUrl: string | null;
  brandColour: string | null;
  name: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}>) {
  const colour = brandColour ?? "#1B4D3E";

  if (isSupabaseAsset(imageUrl)) {
    return (
      <div className={cn("relative overflow-hidden bg-neutral-100", className)}>
        <Image
          src={imageUrl as string}
          alt={name}
          fill
          sizes={sizes ?? "(max-width: 768px) 100vw, 33vw"}
          priority={priority}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${colour} 0%, ${colour}cc 55%, #0f2e23 100%)`,
      }}
      aria-hidden
    >
      {/* Subtle architectural texture */}
      <div className="absolute inset-0 opacity-[0.12] [background-image:repeating-linear-gradient(90deg,#fff_0,#fff_1px,transparent_1px,transparent_28px),repeating-linear-gradient(0deg,#fff_0,#fff_1px,transparent_1px,transparent_28px)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      <svg
        className="absolute bottom-4 right-4 size-10 text-white/30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
