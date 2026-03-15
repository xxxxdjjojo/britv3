"use client";

import { useState } from "react";
import InboxList from "@/components/messaging/InboxList";
import MessageThread from "@/components/messaging/MessageThread";
import { cn } from "@/lib/utils";

export default function InboxPageClient() {
  const [activeConversation, setActiveConversation] = useState<string | null>(null);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden border-t">
      {/* Conversation list - hidden on mobile when a thread is selected */}
      <div
        className={cn(
          "w-full max-w-xs border-r bg-card flex-shrink-0",
          activeConversation ? "hidden md:flex md:flex-col" : "flex flex-col",
        )}
      >
        <InboxList
          activeId={activeConversation ?? undefined}
          onSelectConversation={setActiveConversation}
        />
      </div>

      {/* Message thread - hidden on mobile when no thread is selected */}
      <div
        className={cn(
          "flex-1 min-w-0",
          activeConversation ? "flex flex-col" : "hidden md:flex md:flex-col",
        )}
      >
        {activeConversation ? (
          <MessageThread conversationId={activeConversation} recipientId="" />
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
