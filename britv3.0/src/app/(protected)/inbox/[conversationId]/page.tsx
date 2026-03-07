import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MessageThread from "@/components/messaging/MessageThread";
import MessageComposer from "@/components/messaging/MessageComposer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    .select("id, participant_1_id, participant_2_id, context_type")
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
        <Button variant="ghost" size="sm" render={<Link href="/inbox" />}>
          Back
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{participantName}</h1>
          <Badge variant="secondary" className="capitalize">
            {conversation.context_type}
          </Badge>
        </div>
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-hidden border-x bg-card">
        <MessageThread
          conversationId={conversationId}
          currentUserId={user.id}
        />
      </div>

      {/* Composer (sticky at bottom) */}
      <div className="border rounded-b-lg bg-card">
        <MessageComposer
          conversationId={conversationId}
          recipientId={otherUserId}
          contextType={conversation.context_type}
        />
      </div>
    </div>
  );
}
