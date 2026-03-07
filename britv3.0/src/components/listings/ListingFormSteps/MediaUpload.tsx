"use client";

import type { UseFormReturn } from "react-hook-form";
import { ImageUploader } from "../ImageUploader";
import type { ListingFormValues } from "../ListingForm";

export function MediaUpload(
  props: Readonly<{
    form: UseFormReturn<ListingFormValues>;
    listingId: string | null;
  }>,
) {
  if (!props.listingId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 py-12 text-center">
        <p className="text-sm text-neutral-500">
          A draft listing must be created before uploading media.
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          Complete Step 1 to create a draft listing first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Property Photos */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-neutral-900">
          Property Photos
        </h3>
        <p className="text-xs text-neutral-500">
          Upload up to 30 photos. Images will be compressed and converted to
          WebP format automatically.
        </p>
        <ImageUploader
          listingId={props.listingId}
          accept={{ "image/jpeg": [], "image/png": [], "image/webp": [] }}
          maxFiles={30}
        />
      </div>

      {/* Floor Plans */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-neutral-900">
          Floor Plans (optional)
        </h3>
        <p className="text-xs text-neutral-500">
          Upload floor plan images or PDFs.
        </p>
        <ImageUploader
          listingId={props.listingId}
          accept={{
            "image/jpeg": [],
            "image/png": [],
            "image/webp": [],
            "application/pdf": [],
          }}
          maxFiles={5}
          mediaType="floor_plan"
        />
      </div>

      {/* EPC Document */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-neutral-900">
          EPC Document (optional)
        </h3>
        <p className="text-xs text-neutral-500">
          Upload your EPC certificate image or PDF.
        </p>
        <ImageUploader
          listingId={props.listingId}
          accept={{
            "image/jpeg": [],
            "image/png": [],
            "image/webp": [],
            "application/pdf": [],
          }}
          maxFiles={2}
          mediaType="epc_document"
        />
      </div>
    </div>
  );
}
