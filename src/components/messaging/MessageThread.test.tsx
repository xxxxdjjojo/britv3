import { render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { Message } from "@/types/messaging";

// MessageThread pulls in MessageComposer, which instantiates a Supabase client at
// module load. Stub it so importing MessageBubble stays isolated and side-effect free.
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ channel: () => ({ send: vi.fn() }) }),
}));

import { MessageBubble, MessageGroupList } from "./MessageThread";

const baseMessage: Message = {
  id: "m1",
  conversation_id: "c1",
  sender_id: "u1",
  content: "Hello there",
  attachment_url: null,
  attachment_type: null,
  attachment_size_bytes: null,
  created_at: new Date("2026-06-13T10:00:00Z"),
  sender_name: "Jane Doe",
};

function msg(overrides: Partial<Message>): Message {
  return { ...baseMessage, ...overrides };
}

describe("MessageBubble", () => {
  it("renders the message content", () => {
    render(<MessageBubble message={baseMessage} isOwn={false} />);
    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });

  it("aligns the current user's own messages to the end (right)", () => {
    render(<MessageBubble message={baseMessage} isOwn />);
    const message = screen.getByTestId("message-m1");
    expect(message.getAttribute("data-align")).toBe("end");
  });

  it("aligns the other participant's messages to the start (left)", () => {
    render(<MessageBubble message={baseMessage} isOwn={false} />);
    const message = screen.getByTestId("message-m1");
    expect(message.getAttribute("data-align")).toBe("start");
  });

  it("uses the brand-green (primary) bubble surface for own messages", () => {
    render(<MessageBubble message={baseMessage} isOwn />);
    const bubble = screen.getByTestId("message-m1").querySelector(
      "[data-slot=bubble]",
    );
    // default Bubble variant maps bubble-content to bg-primary (#1B4D3E brand green)
    expect(bubble?.getAttribute("data-variant")).toBe("default");
  });

  it("uses the muted neutral surface for the other participant's messages", () => {
    render(<MessageBubble message={baseMessage} isOwn={false} />);
    const bubble = screen.getByTestId("message-m1").querySelector(
      "[data-slot=bubble]",
    );
    expect(bubble?.getAttribute("data-variant")).toBe("muted");
  });

  it("renders an image attachment", () => {
    render(
      <MessageBubble
        message={msg({ attachment_url: "https://x/p.png", attachment_type: "image" })}
        isOwn={false}
      />,
    );
    expect(screen.getByRole("img", { name: /attachment/i })).toBeInTheDocument();
  });

  it("renders a pdf attachment download link", () => {
    render(
      <MessageBubble
        message={msg({ attachment_url: "https://x/d.pdf", attachment_type: "pdf" })}
        isOwn={false}
      />,
    );
    expect(screen.getByRole("link", { name: /pdf/i })).toBeInTheDocument();
  });
});

describe("MessageGroupList", () => {
  it("groups consecutive messages from the same sender", () => {
    const messages = [
      msg({ id: "a", sender_id: "u1", content: "first" }),
      msg({ id: "b", sender_id: "u1", content: "second" }),
      msg({ id: "c", sender_id: "u2", content: "reply" }),
    ];
    render(<MessageGroupList messages={messages} currentUserId="u2" />);

    const groups = screen.getAllByTestId("message-group");
    // u1 (two messages) collapse into one group, u2 into another => 2 groups
    expect(groups).toHaveLength(2);
    // first group holds both of u1's messages
    expect(within(groups[0]).getByText("first")).toBeInTheDocument();
    expect(within(groups[0]).getByText("second")).toBeInTheDocument();
    expect(within(groups[1]).getByText("reply")).toBeInTheDocument();
  });

  it("marks the current user's group as align=end", () => {
    const messages = [msg({ id: "a", sender_id: "me", content: "mine" })];
    render(<MessageGroupList messages={messages} currentUserId="me" />);
    expect(screen.getByTestId("message-a").getAttribute("data-align")).toBe("end");
  });
});
