"use client";

/**
 * MessageComposer -- textarea with file attach support and Ctrl+Enter send.
 */

import { useRef, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import posthog from "posthog-js";
import { useSendMessage } from "@/hooks/useMessages";
import { createClient } from "@/lib/supabase/client";
import { uploadAttachment } from "@/services/messaging/attachment-service";
import { getSuggestedReplies } from "@/services/smart-replies/smart-replies";
import { Textarea } from "@/components/ui/textarea";
import AttachmentPreview from "@/components/messaging/AttachmentPreview";

const MAX_CHARS = 5000;
const supabase = createClient();

export default function MessageComposer(
  props: Readonly<{
    conversationId: string;
    recipientId: string;
    contextType?: string;
    lastMessageContent?: string;
    currentUserId?: string;
  }>,
) {
  const { conversationId, recipientId, contextType = "general", lastMessageContent = "", currentUserId } = props;
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(
    () => (content === "" ? getSuggestedReplies(contextType, lastMessageContent) : []),
    [content, contextType, lastMessageContent],
  );

  const sendMutation = useSendMessage(conversationId);

  const handleSend = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed && !selectedFile) return;
    if (sendMutation.isPending || isUploading) return;

    let attachmentPayload: {
      message_id?: string;
      attachment_url?: string;
      attachment_type?: string;
      attachment_size_bytes?: number;
    } = {};

    if (selectedFile) {
      setIsUploading(true);
      try {
        const supabase = createClient();
        const messageId = crypto.randomUUID();
        const result = await uploadAttachment(supabase, selectedFile, conversationId, messageId);
        posthog.capture("attachment_uploaded", {
          file_type: result.type,
          file_size_bytes: result.sizeBytes,
        });
        attachmentPayload = {
          message_id: messageId,
          attachment_url: result.url,
          attachment_type: result.type,
          attachment_size_bytes: result.sizeBytes,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        toast.error(msg);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    sendMutation.mutate(
      {
        content: trimmed || "(attachment)",
        recipient_id: recipientId,
        context_type: contextType,
        ...attachmentPayload,
      },
      {
        onSuccess: () => {
          setContent("");
          setSelectedFile(null);
        },
      },
    );
  }, [content, selectedFile, sendMutation, recipientId, contextType, conversationId, isUploading]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setSelectedFile(file);
      }
      // Reset so same file can be re-selected
      e.target.value = "";
    },
    [],
  );

  const charCount = content.length;

  return (
    <div className="border-t border-neutral-100/60 dark:border-neutral-700/60 bg-card px-4 py-3 space-y-2">
      {/* Attachment preview */}
      {selectedFile && (
        <AttachmentPreview
          file={selectedFile}
          onRemove={() => setSelectedFile(null)}
        />
      )}

      {/* Smart reply chips */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-neutral-400/30 focus-visible:ring-offset-2"
              onClick={() => setContent(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Composer row */}
      <div className="flex items-end gap-2">
        {/* Attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 rounded-lg p-2 text-neutral-400 hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-neutral-400/30 focus-visible:ring-offset-2"
          title="Attach file"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Message input */}
        <div className="flex-1 relative rounded-xl bg-muted/50 border border-neutral-200/60 dark:border-neutral-700/60">
          <Textarea
            placeholder="Type a message... (Ctrl+Enter to send)"
            value={content}
            onChange={(e) => {
              setContent(e.target.value.slice(0, MAX_CHARS));
              void supabase.channel(`typing:${conversationId}`).send({
                type: "broadcast",
                event: "typing",
                payload: { user_id: currentUserId ?? "", is_typing: true },
              });
            }}
            onKeyDown={handleKeyDown}
            rows={1}
            className="pr-16 min-h-10 max-h-32 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <span className="absolute right-2 bottom-1 font-body text-[10px] text-neutral-400">
            {charCount}/{MAX_CHARS}
          </span>
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={
            sendMutation.isPending || isUploading || (!content.trim() && !selectedFile)
          }
          className="shrink-0 rounded-lg bg-brand-primary p-2 text-white hover:bg-brand-primary/90 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          <span className="sr-only">
            {isUploading ? "Uploading..." : sendMutation.isPending ? "Sending..." : "Send"}
          </span>
        </button>
      </div>
    </div>
  );
}
