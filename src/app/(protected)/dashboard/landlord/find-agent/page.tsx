"use client";

/**
 * Find a Letting Agent (9.21)
 * Landlord-context browse page over marketplace service_provider_details data,
 * filtered to property_management category (closest equivalent to letting agent).
 * Gracefully handles empty state when no providers are registered yet.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Star,
  MapPin,
  Building2,
  ExternalLink,
  MessageSquare,
} from "lucide-react";

// -- Types -------------------------------------------------------------------

type LettingAgent = {
  user_id: string;
  business_name: string;
  business_description: string | null;
  slug: string;
  years_in_business: number;
  completed_jobs_count: number;
};

// -- Helpers -----------------------------------------------------------------

function StarRating({ count = 0 }: Readonly<{ count?: number }>) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`size-3.5 ${
            i <= Math.round(count / 10)
              ? "fill-warning text-warning"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

// -- Page component ----------------------------------------------------------

export default function FindAgentPage() {
  const [agents, setAgents] = useState<LettingAgent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Query providers with property_management service category (letting agents).
      // services is an array field — use the @> (contains) operator.
      const { data, error: queryError } = await supabase
        .from("service_provider_details")
        .select(
          "user_id, business_name, business_description, slug, years_in_business, completed_jobs_count",
        )
        .contains("services", ["property_management"])
        .order("completed_jobs_count", { ascending: false })
        .limit(20);

      if (queryError) {
        // Graceful empty state — table may not exist yet if Epic 4 not deployed
        console.warn("Could not fetch letting agents:", queryError.message);
        setAgents([]);
      } else {
        setAgents((data ?? []) as LettingAgent[]);
      }
    } catch (err) {
      console.warn("Find agent fetch failed:", err);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAgents();
  }, [loadAgents]);

  // Client-side filter by business name / description
  const filtered = agents.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.business_name.toLowerCase().includes(q) ||
      (a.business_description ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight font-heading">
          Find a Letting Agent
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse verified letting agents who can manage your properties
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="flex flex-col gap-3 pt-4">
                <div className="h-5 w-2/3 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-8 w-24 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error / empty state */}
      {!loading && filtered.length === 0 && !error && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Building2 className="size-12 text-muted-foreground/40" />
            <div>
              <p className="font-medium text-muted-foreground">
                No letting agents registered yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground/70">
                Check back soon — verified letting agents will appear here once
                they register on Britestate.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent cards */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((agent) => (
            <Card
              key={agent.user_id}
              className="flex flex-col justify-between"
            >
              <CardContent className="flex flex-col gap-3 pt-4">
                {/* Name + badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold leading-tight">
                      {agent.business_name}
                    </p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      Letting Agent
                    </Badge>
                  </div>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary-lighter">
                    <Building2 className="size-5 text-brand-primary" />
                  </div>
                </div>

                {/* Description */}
                {agent.business_description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {agent.business_description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <StarRating count={agent.completed_jobs_count} />
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    {agent.years_in_business} yr
                    {agent.years_in_business !== 1 ? "s" : ""} experience
                  </span>
                  <span>{agent.completed_jobs_count} jobs</span>
                </div>

                {/* View Profile */}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 w-fit"
                  render={
                    <Link
                      href={`/services/property-management/${agent.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  <ExternalLink className="mr-1.5 size-3.5" />
                  View Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CTA section */}
      <Card className="border-brand-primary/20 bg-brand-primary-lighter/30">
        <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">List with an agent</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Found an agent you like? Invite them to manage your properties
              using the messaging system.
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            className="shrink-0"
            render={<Link href="/dashboard/landlord/maintenance" />}
          >
            <MessageSquare className="mr-1.5 size-4" />
            Message an Agent
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
