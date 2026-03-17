"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AgentLead } from "@/types/agent";

export function LeadCard({ lead }: Readonly<{ lead: AgentLead }>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <a
        href={`/dashboard/agent/leads/${lead.id}`}
        onClick={(e) => {
          if (isDragging) e.preventDefault();
        }}
      >
        <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <p className="font-medium text-sm">{lead.contact_name}</p>
            {lead.contact_email && (
              <p className="text-xs text-muted-foreground truncate">
                {lead.contact_email}
              </p>
            )}
            {lead.source && (
              <Badge variant="outline" className="text-xs mt-1">
                {lead.source}
              </Badge>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(lead.created_at).toLocaleDateString("en-GB")}
            </p>
          </CardContent>
        </Card>
      </a>
    </div>
  );
}
