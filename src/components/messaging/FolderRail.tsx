"use client";

/**
 * FolderRail -- left navigation rail for the inbox. Lists the six Gmail-style
 * folders with a lucide icon and a live count badge each. The active folder is
 * highlighted and exposed via aria-current. Pure presentational: state lives in
 * the parent shell.
 */

import type { LucideIcon } from "lucide-react";
import { Inbox, MailOpen, Send, FileEdit, Archive, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Folder } from "@/types/messaging";

type FolderRailProps = Readonly<{
  activeFolder: Folder;
  counts: Record<Folder, number>;
  onSelect: (folder: Folder) => void;
  /** Optional: called after selection (e.g. to close a mobile drawer). */
  onAfterSelect?: () => void;
  className?: string;
}>;

type FolderEntry = Readonly<{
  id: Folder;
  label: string;
  icon: LucideIcon;
}>;

const FOLDERS: readonly FolderEntry[] = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "unread", label: "Unread", icon: MailOpen },
  { id: "sent", label: "Sent", icon: Send },
  { id: "drafts", label: "Drafts", icon: FileEdit },
  { id: "archived", label: "Archived", icon: Archive },
  { id: "spam", label: "Spam", icon: ShieldAlert },
];

export default function FolderRail({
  activeFolder,
  counts,
  onSelect,
  onAfterSelect,
  className,
}: FolderRailProps) {
  return (
    <nav
      aria-label="Folders"
      className={cn("flex flex-col gap-1 p-3", className)}
    >
      <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Folders
      </p>
      {FOLDERS.map(({ id, label, icon: Icon }) => {
        const isActive = id === activeFolder;
        const count = counts[id] ?? 0;

        return (
          <button
            key={id}
            type="button"
            aria-current={isActive ? "true" : undefined}
            onClick={() => {
              onSelect(id);
              onAfterSelect?.();
            }}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40",
              isActive
                ? "bg-brand-primary text-white shadow-sm"
                : "text-foreground hover:bg-brand-primary-lighter",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                isActive
                  ? "text-white"
                  : "text-brand-primary-light group-hover:text-brand-primary-dark",
              )}
              aria-hidden="true"
            />
            <span className="flex-1 truncate font-medium">{label}</span>
            {count > 0 && (
              <span
                className={cn(
                  "inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-brand-primary-lighter text-brand-primary-dark",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
