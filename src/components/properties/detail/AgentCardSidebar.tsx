import Image from "next/image";
import { Phone, Mail, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = Readonly<{
  agentId: string;
  propertyId: string;
}>;

type AgentData = {
  display_name: string | null;
  avatar_url: string | null;
  agency_name: string | null;
  phone: string | null;
  email: string | null;
};

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchAgent(agentId: string): Promise<AgentData | null> {
  const supabase = await createClient();

  // Fetch profile row
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, phone")
    .eq("id", agentId)
    .single();

  if (profileError || !profile) return null;

  // Fetch agency profile (may not exist if user is a private seller)
  const { data: agency } = await supabase
    .from("agent_agency_profiles")
    .select("agency_name, contact_email, contact_phone")
    .eq("agent_id", agentId)
    .maybeSingle();

  // Fetch email from auth.users via profiles — Supabase doesn't expose this
  // directly; fall back to agency contact_email if available.
  return {
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    agency_name: agency?.agency_name ?? null,
    phone: agency?.contact_phone ?? profile.phone ?? null,
    email: agency?.contact_email ?? null,
  };
}

// ---------------------------------------------------------------------------
// Fallback card shown when agent data is not found
// ---------------------------------------------------------------------------

function FallbackContactCard({ propertyId }: Readonly<{ propertyId: string }>) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center shrink-0">
          <User className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold">Contact the Agent</p>
          <p className="text-xs text-muted-foreground">Get in touch about this property</p>
        </div>
      </div>
      <a
        href={`#contact-agent-${propertyId}`}
        className="block w-full rounded-lg py-2.5 px-4 text-sm font-semibold text-center text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--brand-primary, #1B4D3E)" }}
      >
        Contact Agent
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export async function AgentCardSidebar({ agentId, propertyId }: Props) {
  const agent = await fetchAgent(agentId);

  if (!agent) {
    return <FallbackContactCard propertyId={propertyId} />;
  }

  const displayName = agent.display_name ?? "Agent";

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      {/* Identity row */}
      <div className="flex items-center gap-3">
        <div className="relative size-12 rounded-full overflow-hidden bg-muted shrink-0">
          {agent.avatar_url ? (
            <Image
              src={agent.avatar_url}
              alt={`Photo of ${displayName}`}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="size-full flex items-center justify-center">
              <User className="size-5 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{displayName}</p>
          {agent.agency_name && (
            <p className="text-xs text-muted-foreground truncate">{agent.agency_name}</p>
          )}
        </div>
      </div>

      {/* Contact details */}
      {agent.phone && (
        <a
          href={`tel:${agent.phone.replace(/\s/g, "")}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Phone className="size-4 shrink-0" />
          <span className="truncate">{agent.phone}</span>
        </a>
      )}

      {/* Primary CTA — links to AskAgentForm anchor on the same page */}
      <a
        href={`#ask-agent-${propertyId}`}
        className="flex items-center justify-center gap-2 w-full rounded-lg py-2.5 px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--brand-primary, #1B4D3E)" }}
      >
        <Mail className="size-4" />
        Contact Agent
      </a>

      {/* Email fallback if anchor isn't available */}
      {agent.email && (
        <a
          href={`mailto:${agent.email}`}
          className="block text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          or email directly
        </a>
      )}
    </div>
  );
}
