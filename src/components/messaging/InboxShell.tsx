"use client";

/**
 * InboxShell -- the three-pane mail shell: FolderRail | InboxList | thread.
 * Owns the active-folder state, the Supabase Realtime subscription that keeps
 * the inbox fresh, and the mobile pane-switching (list <-> thread). The folder
 * rail is a fixed column on desktop and a Sheet drawer on mobile.
 */

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import InboxList from "@/components/messaging/InboxList";
import MessageThread from "@/components/messaging/MessageThread";
import FolderRail from "@/components/messaging/FolderRail";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInboxFolders } from "@/hooks/useInbox";
import { cn } from "@/lib/utils";
import type { Folder } from "@/types/messaging";

const FOLDER_LABELS: Record<Folder, string> = {
  inbox: "Inbox",
  unread: "Unread",
  sent: "Sent",
  drafts: "Drafts",
  archived: "Archived",
  spam: "Spam",
};

export default function InboxShell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const [activeFolder, setActiveFolder] = useState<Folder>("inbox");
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(null);
  const [mobileFoldersOpen, setMobileFoldersOpen] = useState(false);

  const {
    conversations: allConversations,
    counts,
    filterByFolder,
    isLoading,
    error,
  } = useInboxFolders();
  const conversations = filterByFolder(activeFolder);

  // Name shown in the thread header — looked up from the open conversation so
  // the header reads e.g. "Tom Richards" (with initials), not a generic label.
  const activeParticipantName =
    allConversations.find((c) => c.id === activeConversation)?.participant_name ??
    undefined;

  // Realtime: refresh the inbox when either participant column changes.
  useEffect(() => {
    if (!user?.id) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`inbox:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `participant_1_id=eq.${user.id}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["inbox"] });
          void queryClient.invalidateQueries({ queryKey: ["unread-count"] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `participant_2_id=eq.${user.id}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["inbox"] });
          void queryClient.invalidateQueries({ queryKey: ["unread-count"] });
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      void channel.unsubscribe();
      channelRef.current = null;
    };
  }, [user?.id, queryClient]);

  function handleSelectFolder(folder: Folder) {
    setActiveFolder(folder);
    // Folder switch clears the open thread so the list pane is shown on mobile.
    setActiveConversation(null);
    setActiveRecipientId(null);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden border-t border-border">
      {/* Folder rail — fixed column on desktop */}
      <aside className="hidden w-56 shrink-0 border-r border-border bg-surface md:block">
        <FolderRail
          activeFolder={activeFolder}
          counts={counts}
          onSelect={handleSelectFolder}
        />
      </aside>

      {/* Conversation list — hidden on mobile when a thread is open */}
      <div
        className={cn(
          "w-full flex-shrink-0 border-r border-border bg-surface md:max-w-xs",
          activeConversation ? "hidden md:flex md:flex-col" : "flex flex-col",
        )}
      >
        {/* Mobile-only header: folder drawer trigger + current folder label */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 md:hidden">
          <Sheet open={mobileFoldersOpen} onOpenChange={setMobileFoldersOpen}>
            <SheetTrigger
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-brand-primary-dark hover:bg-brand-primary-lighter"
              aria-label="Open folders"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="px-4 pt-4 text-base font-bold text-foreground">
                Messages
              </SheetTitle>
              <FolderRail
                activeFolder={activeFolder}
                counts={counts}
                onSelect={handleSelectFolder}
                onAfterSelect={() => setMobileFoldersOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <span className="text-sm font-bold text-foreground">
            {FOLDER_LABELS[activeFolder]}
          </span>
        </div>

        <InboxList
          conversations={conversations}
          folder={activeFolder}
          isLoading={isLoading}
          error={error}
          activeId={activeConversation ?? undefined}
          onSelectConversation={(id, recipientId) => {
            setActiveConversation(id);
            setActiveRecipientId(recipientId);
          }}
        />
      </div>

      {/* Message thread — hidden on mobile when no thread is selected */}
      <div
        className={cn(
          "min-w-0 flex-1",
          activeConversation ? "flex flex-col" : "hidden md:flex md:flex-col",
        )}
      >
        {activeConversation ? (
          <MessageThread
            conversationId={activeConversation}
            recipientId={activeRecipientId ?? ""}
            participantName={activeParticipantName}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-surface text-sm text-muted-foreground">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
