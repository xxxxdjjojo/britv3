export type BookingStatus =
  | "pending_confirmation"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "declined";

export type TransitionActor = "user" | "provider" | "system";

type Transition = Readonly<{
  from: BookingStatus;
  to: BookingStatus;
  actors: readonly TransitionActor[];
  requiresReason: boolean;
}>;

/**
 * All 9 valid booking status transitions per epic spec S06.
 */
export const VALID_TRANSITIONS: readonly Transition[] = [
  // Provider confirms or declines pending booking
  { from: "pending_confirmation", to: "confirmed", actors: ["provider"], requiresReason: false },
  { from: "pending_confirmation", to: "declined", actors: ["provider"], requiresReason: true },

  // User cancels pending booking
  { from: "pending_confirmation", to: "cancelled", actors: ["user"], requiresReason: false },

  // User cancels confirmed booking
  { from: "confirmed", to: "cancelled", actors: ["user"], requiresReason: false },

  // Provider cancels confirmed booking (requires reason)
  { from: "confirmed", to: "cancelled", actors: ["provider"], requiresReason: true },

  // Provider starts work on confirmed booking
  { from: "confirmed", to: "in_progress", actors: ["provider"], requiresReason: false },

  // Provider or system completes in-progress booking
  { from: "in_progress", to: "completed", actors: ["provider", "system"], requiresReason: false },

  // User cancels in-progress booking (requires reason)
  { from: "in_progress", to: "cancelled", actors: ["user"], requiresReason: true },

  // Provider cancels in-progress booking (requires reason)
  { from: "in_progress", to: "cancelled", actors: ["provider"], requiresReason: true },
] as const;

/**
 * Check whether a status transition is valid for the given actor.
 */
export function canTransition(
  currentStatus: BookingStatus,
  newStatus: BookingStatus,
  actorRole: TransitionActor
): { allowed: boolean; requiresReason: boolean } {
  const match = VALID_TRANSITIONS.find(
    (t) =>
      t.from === currentStatus &&
      t.to === newStatus &&
      t.actors.includes(actorRole)
  );

  if (match) {
    return { allowed: true, requiresReason: match.requiresReason };
  }

  return { allowed: false, requiresReason: false };
}

/**
 * Get all valid next statuses for the given current status and actor role.
 */
export function getValidNextStatuses(
  currentStatus: BookingStatus,
  actorRole: TransitionActor
): BookingStatus[] {
  return VALID_TRANSITIONS
    .filter((t) => t.from === currentStatus && t.actors.includes(actorRole))
    .map((t) => t.to);
}
