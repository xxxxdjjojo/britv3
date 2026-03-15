"use client";

import { Video } from "lucide-react";

type VideoTourPlayerProps = Readonly<{
  videoUrl: string | null;
}>;

// ---------------------------------------------------------------------------
// YouTube URL helpers
// ---------------------------------------------------------------------------

function isYouTubeUrl(url: string): boolean {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

/**
 * Converts any YouTube watch/short URL into an embed URL.
 * Examples:
 *   https://www.youtube.com/watch?v=dQw4w9WgXcQ  → https://www.youtube.com/embed/dQw4w9WgXcQ
 *   https://youtu.be/dQw4w9WgXcQ                 → https://www.youtube.com/embed/dQw4w9WgXcQ
 *   https://www.youtube.com/embed/dQw4w9WgXcQ    → unchanged
 */
function toYouTubeEmbedUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Already an embed URL
    if (parsed.pathname.startsWith("/embed/")) {
      return url;
    }

    // youtu.be short link
    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.slice(1);
      return `https://www.youtube.com/embed/${id}`;
    }

    // youtube.com/watch?v=...
    const videoId = parsed.searchParams.get("v");
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch {
    // URL parse failure — return as-is
  }
  return url;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VideoTourPlayer({ videoUrl }: VideoTourPlayerProps) {
  // Empty state
  if (!videoUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-neutral-50 p-10 text-center">
        <Video className="size-10 text-neutral-300" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Video tour not available
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            This property doesn&apos;t have a video tour yet.
          </p>
        </div>
      </div>
    );
  }

  // 16:9 aspect-ratio container
  const containerClass =
    "relative w-full overflow-hidden rounded-xl border" +
    " [aspect-ratio:16/9]";

  if (isYouTubeUrl(videoUrl)) {
    const embedUrl = toYouTubeEmbedUrl(videoUrl);
    return (
      <div className={containerClass}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={embedUrl}
          title="Video tour"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  // Generic video file
  return (
    <div className={containerClass}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        className="absolute inset-0 w-full h-full object-contain bg-black"
        controls
        preload="metadata"
      >
        <source src={videoUrl} />
        Your browser does not support video playback.
      </video>
    </div>
  );
}
