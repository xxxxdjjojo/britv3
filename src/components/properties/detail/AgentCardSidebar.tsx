import Image from "next/image";
import { Phone, Mail, User, Star, ExternalLink } from "lucide-react";
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
  rating?: number | null;
  review_count?: number | null;
};

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchAgent(agentId: string): Promise<AgentData | null> {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, phone")
    .eq("id", agentId)
    .single();

  if (profileError || !profile) return null;

  const { data: agency } = await supabase
    .from("agent_agency_profiles")
    .select("agency_name, contact_email, contact_phone")
    .eq("agent_id", agentId)
    .maybeSingle();

  return {
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    agency_name: agency?.agency_name ?? null,
    phone: agency?.contact_phone ?? profile.phone ?? null,
    email: agency?.contact_email ?? null,
    rating: null,
    review_count: null,
  };
}

// ---------------------------------------------------------------------------
// Fallback card
// ---------------------------------------------------------------------------

function FallbackContactCard({ propertyId }: Readonly<{ propertyId: string }>) {
  return (
    <div className="rounded-2xl bg-white border border-neutral-200 p-5 space-y-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
          <User className="size-5 text-neutral-400" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900">Contact the Agent</p>
          <p className="text-xs text-neutral-500">Get in touch about this property</p>
        </div>
      </div>
      <a
        href={`#ask-agent-${propertyId}`}
        className="flex items-center justify-center gap-2 w-full rounded-xl py-3 px-4 text-sm font-semibold text-white bg-brand-primary hover:opacity-90 transition-opacity min-h-[44px]"
        aria-label="Contact agent about this property"
      >
        <Mail className="size-4" aria-hidden="true" />
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
    <div className="rounded-2xl bg-white border border-neutral-200 p-5 space-y-4 shadow-sm">
      {/* Identity row */}
      <div className="flex items-center gap-3">
        <div className="relative size-14 rounded-full overflow-hidden bg-neutral-100 shrink-0 ring-2 ring-neutral-100">
          {agent.avatar_url ? (
            <Image
              src={agent.avatar_url}
              alt={`Photo of ${displayName}`}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <div className="size-full flex items-center justify-center bg-brand-primary/10">
              <User className="size-6 text-brand-primary" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-neutral-900 truncate">{displayName}</p>
          {agent.agency_name && (
            <p className="text-xs text-neutral-500 truncate">{agent.agency_name}</p>
          )}
          {agent.rating != null && (
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="size-3 text-brand-secondary fill-brand-secondary" aria-hidden="true" />
              <span className="text-xs font-medium text-neutral-700">{agent.rating.toFixed(1)}</span>
              {agent.review_count != null && agent.review_count > 0 && (
                <span className="text-xs text-neutral-400">({agent.review_count})</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-neutral-100" />

      {/* Contact details */}
      {agent.phone && (
        <a
          href={`tel:${agent.phone.replace(/\s/g, "")}`}
          className="flex items-center gap-2.5 text-sm text-neutral-600 hover:text-brand-primary transition-colors group min-h-[44px]"
          aria-label={`Call ${displayName} on ${agent.phone}`}
        >
          <div className="size-8 rounded-lg bg-neutral-50 flex items-center justify-center group-hover:bg-brand-primary/10 transition-colors shrink-0">
            <Phone className="size-4" aria-hidden="true" />
          </div>
          <span className="truncate">{agent.phone}</span>
        </a>
      )}

      {/* Primary CTA */}
      <a
        href={`#ask-agent-${propertyId}`}
        className="flex items-center justify-center gap-2 w-full rounded-xl py-3 px-4 text-sm font-semibold text-white bg-brand-primary hover:opacity-90 transition-opacity min-h-[44px]"
        aria-label={`Send a message to ${displayName}`}
      >
        <Mail className="size-4" aria-hidden="true" />
        Send a message
      </a>

      {/* Email fallback */}
      {agent.email && (
        <a
          href={`mailto:${agent.email}`}
          className="flex items-center justify-center gap-1.5 text-xs text-neutral-500 hover:text-brand-primary transition-colors min-h-[44px]"
          aria-label={`Email ${displayName} directly`}
        >
          <ExternalLink className="size-3" aria-hidden="true" />
          or email directly
        </a>
      )}
    </div>
  );
}
