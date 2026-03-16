"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MessageSquare, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useInbox, useUnreadCount } from "@/hooks/useInbox";
import type { ContextType, Conversation } from "@/types/messaging";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatRelativeTime(date: Date): string {
  const d = date instanceof Date ? date : new Date(date);
  const diffMs = Date.now() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30) return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return "Just now";
}

function truncate(text: string | null, maxLen = 60): string {
  if (!text) return "";
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "…";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b last:border-0">
      <Skeleton className="size-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="flex flex-col items-end gap-1">
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
  );
}

function ConversationRow({
  conversation,
  href,
}: {
  conversation: Conversation;
  href: string;
}) {
  const name = conversation.participant_name ?? "Unknown";
  const preview = truncate(conversation.last_message_preview);
  const time = formatRelativeTime(conversation.last_message_at);
  const hasUnread = conversation.unread_count > 0;

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors"
    >
      <Avatar className="size-10 shrink-0">
        <AvatarFallback className="text-sm font-medium">
          {getInitials(conversation.participant_name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${hasUnread ? "font-semibold" : "font-medium"}`}>
            {name}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">{time}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground truncate">{preview}</span>
          {hasUnread && (
            <Badge className="shrink-0 h-5 min-w-5 px-1.5 text-xs rounded-full">
              {conversation.unread_count}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const CONTEXT_TABS: { value: "all" | ContextType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "listing", label: "Listings" },
  { value: "booking", label: "Bookings" },
  { value: "general", label: "General" },
];

export default function MessagesPage() {
  const params = useParams();
  const role = params.role as string;

  const [search, setSearch] = useState("");
  const [contextTab, setContextTab] = useState<"all" | ContextType>("all");

  const filters = {
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(contextTab !== "all" ? { context_type: contextTab } : {}),
  };

  const { data, isLoading, isError, refetch } = useInbox(filters);
  const { data: unreadData } = useUnreadCount();

  const conversations = data?.conversations ?? [];
  const totalUnread = unreadData?.count ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
            {totalUnread > 0 && (
              <Badge className="h-5 px-1.5 text-xs rounded-full">{totalUnread}</Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">Your conversations and enquiries</p>
        </div>
      </div>

      <Card>
        {/* Search */}
        <div className="px-4 pt-4 pb-2 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Context filter tabs */}
        <div className="px-4 py-2 border-b">
          <Tabs value={contextTab} onValueChange={(v) => setContextTab(v as typeof contextTab)}>
            <TabsList className="h-8">
              {CONTEXT_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="text-xs px-3 h-7">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <CardContent className="p-0">
          {/* Loading state */}
          {isLoading && (
            <div>
              {Array.from({ length: 5 }).map((_, i) => (
                <ConversationSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="flex flex-col items-center gap-3 py-10 px-4 text-center">
              <p className="text-sm text-muted-foreground">Failed to load messages.</p>
              <button
                onClick={() => refetch()}
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && conversations.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 px-4 text-center">
              <MessageSquare className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No messages yet</p>
            </div>
          )}

          {/* Conversation list */}
          {!isLoading && !isError && conversations.length > 0 && (
            <div>
              {conversations.map((conv) => (
                <ConversationRow
                  key={conv.id}
                  conversation={conv}
                  href={`/dashboard/${role}/messages/${conv.id}`}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
