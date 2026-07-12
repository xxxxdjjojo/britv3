import { createFlagImage, createLollipopImage, PIN_PIXEL_RATIO } from "./pin-images";
import { POI_CATEGORIES } from "./poi-categories";

type ImageSink = {
  hasImage: (id: string) => boolean;
  addImage: (id: string, image: ImageData, options?: { pixelRatio?: number }) => void;
};

/** Registers the flag icon + one lollipop per POI category. Idempotent (guards on hasImage). */
export function registerPinImages(map: ImageSink, doc?: Document): void {
  if (!map.hasImage("td-flag")) {
    map.addImage("td-flag", createFlagImage(doc).imageData, { pixelRatio: PIN_PIXEL_RATIO });
  }
  for (const c of POI_CATEGORIES) {
    const id = `poi-pin-${c.key}`;
    if (!map.hasImage(id)) {
      map.addImage(id, createLollipopImage(c.color, doc).imageData, { pixelRatio: PIN_PIXEL_RATIO });
    }
  }
}
