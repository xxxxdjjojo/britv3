/**
 * Groups property gallery images by room, derived from each image's caption.
 *
 * Returns `null` when there is not enough room metadata to make grouping
 * meaningful — the caller then falls back to a flat gallery. Room categories
 * are NEVER invented: an image is only placed in a room when its caption
 * actually names that room.
 */

export type GalleryImage = Readonly<{
  src: string;
  alt: string;
  caption: string | null;
}>;

export type RoomGroup = Readonly<{ room: string; images: GalleryImage[] }>;

/** Order matters: more specific patterns must precede general ones. */
const ROOM_PATTERNS: ReadonlyArray<{ match: RegExp; room: string }> = [
  { match: /kitchen/i, room: "Kitchen" },
  { match: /\b(master|principal)\s+bed/i, room: "Master bedroom" },
  { match: /bedroom|\bbed\s*\d/i, room: "Bedrooms" },
  { match: /en[-\s]?suite/i, room: "En-suite" },
  { match: /bathroom|shower\s*room/i, room: "Bathroom" },
  { match: /(living|sitting)\s+room|lounge|reception|snug/i, room: "Living room" },
  { match: /dining/i, room: "Dining room" },
  { match: /garden|patio|terrace|balcony|\byard\b|outdoor/i, room: "Garden & outdoor" },
  { match: /exterior|frontage|facade|front\s+of|rear\s+of|street\s+view/i, room: "Exterior" },
  { match: /hall(way)?|landing|entrance/i, room: "Hallway" },
  { match: /study|office/i, room: "Study" },
  { match: /utility|cloakroom|\bwc\b|toilet/i, room: "Utility" },
  { match: /garage|parking|driveway/i, room: "Parking" },
  { match: /conservatory/i, room: "Conservatory" },
  { match: /loft|attic|basement|cellar/i, room: "Loft & basement" },
];

const MIN_DISTINCT_ROOMS = 2;
const MIN_MATCH_RATIO = 0.5;

function roomFor(caption: string | null): string | null {
  if (!caption) return null;
  for (const { match, room } of ROOM_PATTERNS) {
    if (match.test(caption)) return room;
  }
  return null;
}

export function groupImagesByRoom(
  images: readonly GalleryImage[],
): RoomGroup[] | null {
  if (images.length === 0) return null;

  const order: string[] = [];
  const byRoom = new Map<string, GalleryImage[]>();
  const unmatched: GalleryImage[] = [];
  let matchedCount = 0;

  for (const img of images) {
    const room = roomFor(img.caption);
    if (!room) {
      unmatched.push(img);
      continue;
    }
    matchedCount += 1;
    const existing = byRoom.get(room);
    if (existing) {
      existing.push(img);
    } else {
      byRoom.set(room, [img]);
      order.push(room);
    }
  }

  const ratio = matchedCount / images.length;
  if (order.length < MIN_DISTINCT_ROOMS || ratio < MIN_MATCH_RATIO) {
    return null;
  }

  const groups: RoomGroup[] = order.map((room) => ({
    room,
    images: byRoom.get(room) ?? [],
  }));
  if (unmatched.length > 0) {
    groups.push({ room: "More photos", images: unmatched });
  }
  return groups;
}
