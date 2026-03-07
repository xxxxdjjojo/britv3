"use client";

/**
 * AttachmentPreview -- displays image thumbnail or PDF icon.
 * Used in MessageComposer (pre-send with remove) and message bubbles (post-send with open).
 */

import { Button } from "@/components/ui/button";

/** Pre-send preview (file selected, not yet sent) */
function PreSendPreview(
  props: Readonly<{
    file: File;
    onRemove: () => void;
  }>,
) {
  const { file, onRemove } = props;
  const isImage = file.type.startsWith("image/");
  const sizeKB = (file.size / 1024).toFixed(0);

  return (
    <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-2">
      {isImage ? (
        <div className="h-10 w-10 rounded overflow-hidden bg-muted shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={URL.createObjectURL(file)}
            alt="Attachment preview"
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{sizeKB} KB</p>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="shrink-0 text-destructive hover:text-destructive"
      >
        Remove
      </Button>
    </div>
  );
}

/** Post-send attachment display (in message bubble) */
function PostSendPreview(
  props: Readonly<{
    url: string;
    type: "image" | "pdf";
    sizeBytes?: number | null;
  }>,
) {
  const { url, type, sizeBytes } = props;
  const sizeLabel = sizeBytes
    ? `${(sizeBytes / 1024).toFixed(0)} KB`
    : "";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-md border bg-muted/30 p-2 hover:bg-muted/50 transition-colors"
    >
      {type === "image" ? (
        <div className="h-10 w-10 rounded overflow-hidden bg-muted shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Attachment"
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm">
          {type === "pdf" ? "PDF Document" : "Image"}
        </p>
        {sizeLabel && (
          <p className="text-xs text-muted-foreground">{sizeLabel}</p>
        )}
      </div>
    </a>
  );
}

/**
 * Unified attachment preview.
 * - Pass `file` + `onRemove` for pre-send mode.
 * - Pass `url` + `type` for post-send display.
 */
export default function AttachmentPreview(
  props: Readonly<
    | { file: File; onRemove: () => void; url?: never; type?: never; sizeBytes?: never }
    | { url: string; type: "image" | "pdf"; sizeBytes?: number | null; file?: never; onRemove?: never }
  >,
) {
  if (props.file) {
    return <PreSendPreview file={props.file} onRemove={props.onRemove} />;
  }

  if (props.url) {
    return (
      <PostSendPreview
        url={props.url}
        type={props.type}
        sizeBytes={props.sizeBytes}
      />
    );
  }

  return null;
}
