"use client";

/**
 * MessageThread -- Agent Messaging Center chat thread with mock data.
 */

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Phone,
  Video,
  MoreVertical,
  Calendar,
  FileText,
  MapPin,
  CreditCard,
  Paperclip,
  Smile,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- Mock data ---------- */

type MockMessage = {
  id: string;
  content: string;
  time: string;
  isOwn: boolean;
  readStatus?: string;
};

const MOCK_MESSAGES: MockMessage[] = [
  {
    id: "m1",
    content:
      "Hi Alex! I've just seen your inquiry about the Willow Creek property. It's a fantastic choice!",
    time: "10:45 AM",
    isOwn: false,
  },
  {
    id: "m2",
    content:
      "Thanks Sarah! I was wondering if it's possible to schedule a viewing sometime this week? Preferable in the evening.",
    time: "10:48 AM",
    isOwn: true,
    readStatus: "Read",
  },
  {
    id: "m3",
    content:
      "Of course! I have availability on Wednesday at 5:30 PM or Thursday at 6:00 PM. Which works best for you?",
    time: "10:52 AM",
    isOwn: false,
  },
];

const QUICK_ACTIONS = [
  { label: "Schedule Viewing", icon: Calendar },
  { label: "Send Document", icon: FileText },
  { label: "Share Location", icon: MapPin },
  { label: "Request Quote", icon: CreditCard },
] as const;

/* ---------- Sub-components ---------- */

function ThreadHeader() {
  return (
    <div className="flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar>
            <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
              SJ
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Sarah Jenkins</p>
          <p className="text-xs text-muted-foreground">
            Online &middot; Senior Listing Agent
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Call">
          <Phone className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Video call">
          <Video className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="More options">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function DateSeparator(props: Readonly<{ label: string }>) {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground">{props.label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function MessageBubble(props: Readonly<{ message: MockMessage }>) {
  const { message } = props;

  return (
    <div
      className={cn(
        "flex gap-2 max-w-[75%]",
        message.isOwn ? "ml-auto flex-row-reverse" : "mr-auto",
      )}
    >
      {!message.isOwn && (
        <Avatar className="h-8 w-8 shrink-0 mt-1">
          <AvatarFallback className="bg-muted text-foreground text-xs font-medium">
            SJ
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "flex flex-col",
          message.isOwn ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            message.isOwn
              ? "bg-primary text-primary-foreground rounded-br-none"
              : "bg-card border rounded-bl-none",
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
          {message.time}
          {message.readStatus && (
            <span className="text-muted-foreground">&middot; {message.readStatus}</span>
          )}
        </span>
      </div>
    </div>
  );
}

function InlineActions() {
  return (
    <div className="flex gap-2 ml-10 mt-1">
      <Button variant="outline" size="sm" className="rounded-full text-xs">
        Wednesday 5:30 PM
      </Button>
      <Button size="sm" className="rounded-full text-xs">
        Thursday 6:00 PM
      </Button>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 ml-1 mt-2">
      <Avatar className="h-6 w-6">
        <AvatarFallback className="bg-muted text-foreground text-[10px] font-medium animate-pulse">
          SJ
        </AvatarFallback>
      </Avatar>
      <span className="text-xs text-muted-foreground italic">
        Sarah is typing...
      </span>
    </div>
  );
}

function QuickActionsBar() {
  return (
    <div className="flex gap-2 px-4 py-2 border-t overflow-x-auto">
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            className="rounded-full shrink-0 text-xs gap-1.5"
          >
            <Icon className="h-3.5 w-3.5" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}

function ChatInput() {
  return (
    <div className="border-t px-4 py-3">
      <div className="flex items-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Textarea
          placeholder="Type a message..."
          className="min-h-[40px] max-h-[120px] resize-none flex-1"
          rows={1}
        />
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label="Add emoji"
        >
          <Smile className="h-4 w-4" />
        </Button>
        <Button size="icon" className="shrink-0" aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground text-center mt-2">
        All messages are encrypted for your privacy
      </p>
    </div>
  );
}

/* ---------- Main component ---------- */

export default function MessageThread() {
  return (
    <div className="flex flex-col h-full bg-background">
      <ThreadHeader />

      {/* Message feed */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          <DateSeparator label="Monday, Oct 23" />

          {MOCK_MESSAGES.map((msg, i) => (
            <div key={msg.id}>
              <MessageBubble message={msg} />
              {/* Inline quick action buttons after last agent message */}
              {i === MOCK_MESSAGES.length - 1 && !msg.isOwn && <InlineActions />}
            </div>
          ))}

          <TypingIndicator />
        </div>
      </ScrollArea>

      <QuickActionsBar />
      <ChatInput />
    </div>
  );
}
