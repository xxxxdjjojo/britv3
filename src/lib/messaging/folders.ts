/**
 * Folder bucketing helpers. A conversation may appear in several folders at
 * once (Gmail-style), so each predicate is independent. Pure functions — no
 * side effects, no input mutation.
 */

import type { Conversation, Folder } from "@/types/messaging";

const ALL_FOLDERS: readonly Folder[] = [
  "inbox",
  "unread",
  "sent",
  "drafts",
  "archived",
  "spam",
];

function belongsTo(conversation: Conversation, folder: Folder): boolean {
  const isArchived = conversation.archived_at != null;
  const isBlocked = conversation.blocked_at != null;

  switch (folder) {
    case "inbox":
      return !isArchived && !isBlocked;
    case "unread":
      return !isArchived && !isBlocked && conversation.unread_count > 0;
    case "sent":
      return conversation.has_sent === true;
    case "drafts":
      return (
        typeof conversation.draft_text === "string" &&
        conversation.draft_text.length > 0
      );
    case "archived":
      return isArchived;
    case "spam":
      return isBlocked;
  }
}

/** Return the conversations that belong to the given folder. */
export function filterByFolder(
  conversations: Conversation[],
  folder: Folder,
): Conversation[] {
  return conversations.filter((conversation) => belongsTo(conversation, folder));
}

/** Count how many conversations fall into each folder. */
export function folderCounts(
  conversations: Conversation[],
): Record<Folder, number> {
  const counts = Object.fromEntries(
    ALL_FOLDERS.map((folder) => [folder, 0]),
  ) as Record<Folder, number>;

  for (const conversation of conversations) {
    for (const folder of ALL_FOLDERS) {
      if (belongsTo(conversation, folder)) counts[folder] += 1;
    }
  }

  return counts;
}
