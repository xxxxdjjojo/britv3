"use client";

/**
 * ContactForm -- used on listing detail pages to initiate contact.
 * Creates a conversation and sends the first message, then redirects to inbox.
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContextType } from "@/types/messaging";

export default function ContactForm(
  props: Readonly<{
    recipientId: string;
    contextType: ContextType;
    contextId?: string;
    recipientName?: string;
  }>,
) {
  const { recipientId, contextType, contextId, recipientName } = props;
  const router = useRouter();

  const [subject, setSubject] = useState(
    contextType === "listing"
      ? "Enquiry about your listing"
      : contextType === "rfq"
        ? "Request for quote"
        : "",
  );
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = message.trim();
      if (!trimmed) return;

      setIsSubmitting(true);
      setError(null);

      try {
        const body = {
          recipient_id: recipientId,
          content: subject ? `${subject}\n\n${trimmed}` : trimmed,
          context_type: contextType,
          ...(contextId ? { context_id: contextId } : {}),
        };

        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to send message");
        }

        const data = await res.json();
        const conversationId = data.message?.conversation_id;

        if (conversationId) {
          router.push(`/inbox/${conversationId}`);
        } else {
          router.push("/inbox");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [message, subject, recipientId, contextType, contextId, router],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <h3 className="font-heading text-sm font-medium text-foreground">
          Contact {recipientName ?? "this user"}
        </h3>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-subject">Subject</Label>
        <Input
          id="contact-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject (optional)"
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message..."
          rows={4}
          maxLength={5000}
          required
        />
        <p className="text-xs text-muted-foreground text-right">
          {message.length}/5000
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting || !message.trim()}
        className="w-full"
      >
        {isSubmitting ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}
