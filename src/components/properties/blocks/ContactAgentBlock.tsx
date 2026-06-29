import { Separator } from "@/components/ui/separator";
import AskAgentForm from "@/components/properties/detail/AskAgentForm";
import type { PropertyView } from "@/lib/properties/build-property-view";

/**
 * Contact-agent section, anchored (`ask-agent-<id>`) so the AgentCardSidebar
 * "ask a question" link can scroll to it.
 */
export function ContactAgentBlock({ view }: { view: PropertyView }) {
  const { property } = view.detail;
  const agent = view.detail.agent;

  return (
    <section id={`ask-agent-${property.id}`}>
      <h2 className="text-xl font-semibold mb-3">Contact agent</h2>
      <Separator className="mb-4" />
      <AskAgentForm
        propertyId={property.id}
        agentId={agent?.id ?? ""}
        agentName={agent?.displayName || "Agent"}
      />
    </section>
  );
}
