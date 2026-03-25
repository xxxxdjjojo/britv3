/**
 * Checks if a new viewing time conflicts with existing viewings.
 * Uses a configurable buffer (default 60 minutes) to account for travel time.
 */
export function hasViewingConflict(
  existingViewings: Array<{ start_time: string; status: string }>,
  newSlotStart: string,
  bufferMinutes = 60,
): { conflict: boolean; conflictWith?: string } {
  const newTime = new Date(newSlotStart).getTime();
  for (const v of existingViewings) {
    if (v.status === "cancelled") continue;
    const existingTime = new Date(v.start_time).getTime();
    if (Math.abs(newTime - existingTime) < bufferMinutes * 60_000) {
      return { conflict: true, conflictWith: v.start_time };
    }
  }
  return { conflict: false };
}
