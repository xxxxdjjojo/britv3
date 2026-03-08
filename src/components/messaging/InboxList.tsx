"use client";

/**
 * InboxList -- displays conversation list with filtering, search, and skeleton loading.
 */

import { useState } from "react";
import Link from "next/link";
import { useInbox } from "@/hooks/useInbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ContextType, Conversation } from "@/types/messaging";

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function ConversationRow(
  props: Readonly<{ conversation: Conversation }>,
) {
  const { conversation: conv } = props;

  return (
    <Link
      href={`/inbox/${conv.id}`}
      className="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/50"
    >
      <Avatar>
        <AvatarFallback>{getInitials(conv.participant_name)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium truncate">
            {conv.participant_name ?? "Unknown User"}
          </span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {timeAgo(conv.last_message_at)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {conv.last_message_preview ?? "No messages yet"}
        </p>
      </div>

      {conv.unread_count > 0 && (
        <Badge variant="destructive" className="ml-auto shrink-0">
          {conv.unread_count}
        </Badge>
      )}
    </Link>
  );
}

function InboxSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function InboxList() {
  const [contextType, setContextType] = useState<ContextType | undefined>();
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useInbox({
    context_type: contextType,
    search: search || undefined,
  });

  const conversations = data?.conversations ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="flex gap-2 p-3 border-b">
        <Input
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select
          value={contextType ?? "all"}
          onValueChange={(v) =>
            setContextType(v === "all" ? undefined : (v as ContextType))
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="listing">Listing</SelectItem>
            <SelectItem value="booking">Booking</SelectItem>
            <SelectItem value="rfq">Quote</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conversation list */}
      {isLoading ? (
        <InboxSkeleton />
      ) : isError ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          Failed to load conversations. Please try again.
        </div>
      ) : conversations.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          No conversations yet
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {conversations.map((conv) => (
              <ConversationRow key={conv.id} conversation={conv} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
