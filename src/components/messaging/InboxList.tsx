"use client";

/**
 * InboxList -- Agent Messaging Center conversation list with mock data.
 */

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type MockConversation = {
  id: string;
  name: string;
  initials: string;
  lastMessage: string;
  timeAgo: string;
  isOnline: boolean;
  isTyping: boolean;
  isActive: boolean;
};

const MOCK_CONVERSATIONS: MockConversation[] = [
  {
    id: "1",
    name: "Sarah Jenkins",
    initials: "SJ",
    lastMessage: "typing...",
    timeAgo: "2m ago",
    isOnline: true,
    isTyping: true,
    isActive: true,
  },
  {
    id: "2",
    name: "Mark Thompson",
    initials: "MT",
    lastMessage: "I've sent over the contract for your review.",
    timeAgo: "Yesterday",
    isOnline: false,
    isTyping: false,
    isActive: false,
  },
  {
    id: "3",
    name: "Elena Rodriguez",
    initials: "ER",
    lastMessage: "The coastal villa is now available for touring.",
    timeAgo: "3 days ago",
    isOnline: false,
    isTyping: false,
    isActive: false,
  },
];

function ConversationRow(
  props: Readonly<{
    conversation: MockConversation;
    onSelect: (id: string) => void;
  }>,
) {
  const { conversation: conv, onSelect } = props;

  return (
    <button
      type="button"
      onClick={() => onSelect(conv.id)}
      className={cn(
        "flex items-center gap-3 w-full text-left rounded-lg px-3 py-3 transition-colors hover:bg-muted/50",
        conv.isActive && "bg-muted",
      )}
    >
      <div className="relative">
        <Avatar>
          <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
            {conv.initials}
          </AvatarFallback>
        </Avatar>
        {conv.isOnline && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium truncate text-foreground">
            {conv.name}
          </span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {conv.timeAgo}
          </span>
        </div>
        <p
          className={cn(
            "text-xs truncate mt-0.5",
            conv.isTyping
              ? "text-primary italic"
              : "text-muted-foreground",
          )}
        >
          {conv.isTyping ? "typing..." : conv.lastMessage}
        </p>
      </div>
    </button>
  );
}

export default function InboxList(
  props: Readonly<{
    activeId?: string;
    onSelectConversation?: (id: string) => void;
  }>,
) {
  const { onSelectConversation } = props;
  const [search, setSearch] = useState("");

  const filtered = MOCK_CONVERSATIONS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-foreground mb-3">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No conversations found
            </div>
          ) : (
            filtered.map((conv) => (
              <ConversationRow
                key={conv.id}
                conversation={conv}
                onSelect={onSelectConversation ?? (() => {})}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
