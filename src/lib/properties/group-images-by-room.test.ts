import { describe, it, expect } from "vitest";
import {
  groupImagesByRoom,
  type GalleryImage,
} from "./group-images-by-room";

function img(caption: string | null, src = "/x.jpg"): GalleryImage {
  return { src, alt: caption ?? "", caption };
}

describe("groupImagesByRoom", () => {
  it("returns null for an empty list", () => {
    expect(groupImagesByRoom([])).toBeNull();
  });

  it("returns null when no captions name a room (flat fallback)", () => {
    const result = groupImagesByRoom([
      img("Photo 1"),
      img("Photo 2"),
      img(null),
    ]);
    expect(result).toBeNull();
  });

  it("returns null with only a single room represented", () => {
    const result = groupImagesByRoom([img("Kitchen"), img("Kitchen diner")]);
    expect(result).toBeNull();
  });

  it("returns null when fewer than half the images match a room", () => {
    const result = groupImagesByRoom([
      img("Kitchen"),
      img("Master bedroom"),
      img("Photo a"),
      img("Photo b"),
      img("Photo c"),
    ]);
    // 2 matched of 5 = 0.4 < 0.5
    expect(result).toBeNull();
  });

  it("groups by room when there are >=2 rooms and >=50% matched", () => {
    const result = groupImagesByRoom([
      img("Front exterior"),
      img("Kitchen / diner"),
      img("Living room"),
      img("Master bedroom"),
    ]);
    expect(result).not.toBeNull();
    expect(result?.map((g) => g.room)).toEqual([
      "Exterior",
      "Kitchen",
      "Living room",
      "Master bedroom",
    ]);
  });

  it("collects multiple images for the same room and preserves order", () => {
    const result = groupImagesByRoom([
      img("Kitchen", "/k1.jpg"),
      img("Bathroom", "/b1.jpg"),
      img("Kitchen breakfast bar", "/k2.jpg"),
    ]);
    const kitchen = result?.find((g) => g.room === "Kitchen");
    expect(kitchen?.images.map((i) => i.src)).toEqual(["/k1.jpg", "/k2.jpg"]);
  });

  it("places unmatched images into a trailing 'More photos' group", () => {
    const result = groupImagesByRoom([
      img("Kitchen"),
      img("Bathroom"),
      img("Garden"),
      img("Aerial shot"),
    ]);
    expect(result?.[result.length - 1]).toMatchObject({ room: "More photos" });
  });

  it("prefers 'Master bedroom' over generic 'Bedrooms'", () => {
    const result = groupImagesByRoom([
      img("Master bedroom"),
      img("Bedroom two"),
    ]);
    expect(result?.map((g) => g.room)).toEqual(["Master bedroom", "Bedrooms"]);
  });

  it("prefers 'En-suite' over 'Bathroom' when caption mentions en-suite", () => {
    // "Bathroom" pattern precedes en-suite, but en-suite captions usually do
    // not contain the word "bathroom"; verify a real en-suite caption groups
    // correctly alongside a family bathroom.
    const result = groupImagesByRoom([
      img("En-suite"),
      img("Family bathroom"),
    ]);
    expect(result?.map((g) => g.room).sort()).toEqual(["Bathroom", "En-suite"]);
  });
});
