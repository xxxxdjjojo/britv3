import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MessageThread from "@/components/messaging/MessageThread";
import ConversationQuickActions from "@/components/messaging/ConversationQuickActions";
import { Badge } from "@/components/ui/badge";

type PageProps = Readonly<{
  params: Promise<{ conversationId: string }>;
}>;

export default async function ConversationPage({ params }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { conversationId } = await params;

  // Load conversation metadata
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, participant_1_id, participant_2_id, context_type, context_id")
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    redirect("/inbox");
  }

  // Get other participant info
  const otherUserId =
    conversation.participant_1_id === user.id
      ? conversation.participant_2_id
      : conversation.participant_1_id;

  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", otherUserId)
    .single();

  const participantName = otherProfile?.display_name ?? "Unknown User";

  return (
    <div className="container max-w-3xl mx-auto py-6 flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b mb-0">
        <Link
          href="/inbox"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Back
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{participantName}</h1>
          <Badge variant="secondary" className="capitalize">
            {conversation.context_type}
          </Badge>
        </div>
      </div>

      {/* Message thread (includes MessageComposer internally) */}
      <div className="flex-1 overflow-hidden border-x bg-card">
        <MessageThread
          conversationId={conversationId}
          recipientId={otherUserId}
          participantName={participantName}
        />
      </div>

      {/* Quick actions */}
      <div className="border-x bg-card">
        <ConversationQuickActions
          participantName={participantName}
          contextType={conversation.context_type}
          contextId={conversation.context_id ?? undefined}
        />
      </div>
    </div>
  );
}
