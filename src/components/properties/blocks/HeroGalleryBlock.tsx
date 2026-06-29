import { Gallery } from "@/components/properties/Gallery";
import { VirtualTourViewer } from "@/components/properties/detail/VirtualTourViewer";
import { VideoTourPlayer } from "@/components/properties/detail/VideoTourPlayer";
import type { PropertyView } from "@/lib/properties/build-property-view";

/**
 * Block 01 — immersive hero. Edge-to-edge gallery plus any virtual / video
 * tour media. The emotional "is this the home I want?" moment; essentials live
 * in the SummaryHeader directly below.
 */
export function HeroGalleryBlock({ view }: { view: PropertyView }) {
  const { galleryImages, virtualTourUrl, videoTourUrl } = view;

  return (
    <>
      <Gallery images={galleryImages} className="mt-2 mb-6" />

      {(virtualTourUrl || videoTourUrl) && (
        <div className="grid gap-6 sm:grid-cols-2 mb-6">
          {virtualTourUrl && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Virtual Tour</h3>
              <VirtualTourViewer tourUrl={virtualTourUrl} />
            </div>
          )}
          {videoTourUrl && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Video Tour</h3>
              <VideoTourPlayer videoUrl={videoTourUrl} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
