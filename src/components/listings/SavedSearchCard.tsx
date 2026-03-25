"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateSearch, useDeleteSearch } from "@/hooks/useSavedSearches";
import type { SavedSearch } from "@/types/property";
import { Search, Trash2, Pencil } from "lucide-react";

function formatFilters(filters: SavedSearch["filters"]): string {
  const parts: string[] = [];

  if (filters.listing_type) {
    parts.push(filters.listing_type === "sale" ? "Sale" : "Rent");
  }
  if (filters.min_bedrooms) {
    parts.push(`${filters.min_bedrooms}+ beds`);
  }
  if (filters.min_price || filters.max_price) {
    const min = filters.min_price
      ? `\u00A3${(filters.min_price / 1000).toFixed(0)}K`
      : "";
    const max = filters.max_price
      ? `\u00A3${(filters.max_price / 1000).toFixed(0)}K`
      : "";
    if (min && max) {
      parts.push(`${min}-${max}`);
    } else if (min) {
      parts.push(`${min}+`);
    } else {
      parts.push(`Up to ${max}`);
    }
  }
  if (filters.property_type && filters.property_type.length > 0) {
    parts.push(filters.property_type.join(", "));
  }

  return parts.length > 0 ? parts.join(", ") : "All properties";
}

function buildSearchUrl(filters: SavedSearch["filters"]): string {
  const params = new URLSearchParams();

  if (filters.listing_type) params.set("listing_type", filters.listing_type);
  if (filters.min_price) params.set("min_price", String(filters.min_price));
  if (filters.max_price) params.set("max_price", String(filters.max_price));
  if (filters.min_bedrooms) params.set("min_bedrooms", String(filters.min_bedrooms));
  if (filters.max_bedrooms) params.set("max_bedrooms", String(filters.max_bedrooms));
  if (filters.min_bathrooms) params.set("min_bathrooms", String(filters.min_bathrooms));
  if (filters.property_type && filters.property_type.length > 0) {
    params.set("property_type", filters.property_type.join(","));
  }
  if (filters.epc_rating) params.set("epc_rating", filters.epc_rating);
  if (filters.new_build != null) params.set("new_build", String(filters.new_build));

  return `/search?${params.toString()}`;
}

export function SavedSearchCard(
  props: Readonly<{ search: SavedSearch }>,
) {
  const { search } = props;
  const router = useRouter();
  const updateSearch = useUpdateSearch();
  const deleteSearch = useDeleteSearch();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(search.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = useCallback(() => {
    setEditName(search.name);
    setIsEditing(true);
    // Focus input on next tick after render
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [search.name]);

  const handleSaveName = useCallback(() => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditName(search.name);
      setIsEditing(false);
      return;
    }
    if (trimmed === search.name) {
      setIsEditing(false);
      return;
    }
    updateSearch.mutate(
      { searchId: search.id, name: trimmed },
      {
        onSuccess: () => {
          toast.success("Search name updated");
          setIsEditing(false);
        },
        onError: () => {
          toast.error("Failed to update name");
          setEditName(search.name);
          setIsEditing(false);
        },
      },
    );
  }, [editName, search.id, search.name, updateSearch]);

  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSaveName();
      } else if (e.key === "Escape") {
        setEditName(search.name);
        setIsEditing(false);
      }
    },
    [handleSaveName, search.name],
  );

  const handleToggleAlerts = useCallback(
    (enabled: boolean) => {
      updateSearch.mutate(
        { searchId: search.id, alerts_enabled: enabled },
        {
          onError: () => toast.error("Failed to update alerts"),
        },
      );
    },
    [search.id, updateSearch],
  );

  const handleFrequencyChange = useCallback(
    (frequency: "instant" | "daily" | "weekly") => {
      updateSearch.mutate(
        { searchId: search.id, alert_frequency: frequency },
        {
          onError: () => toast.error("Failed to update frequency"),
        },
      );
    },
    [search.id, updateSearch],
  );

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: search info */}
          <div className="min-w-0 flex-1">
            {/* Name row */}
            <div className="flex items-center gap-2">
              {isEditing ? (
                <Input
                  ref={inputRef}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={handleNameKeyDown}
                  className="h-7 max-w-xs text-sm font-medium"
                  maxLength={100}
                />
              ) : (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="group flex items-center gap-1.5 text-left"
                  title="Click to rename"
                >
                  <h3 className="truncate font-medium text-neutral-900">
                    {search.name}
                  </h3>
                  <Pencil className="size-3 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              )}
              {search.new_results_count > 0 && (
                <Badge className="bg-brand-accent text-white">
                  {search.new_results_count} new
                </Badge>
              )}
            </div>

            {/* Filters summary */}
            <p className="mt-1 truncate text-sm text-neutral-500">
              {formatFilters(search.filters)}
            </p>

            {/* Alert controls row */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={search.alerts_enabled}
                  onCheckedChange={handleToggleAlerts}
                  aria-label="Toggle alerts"
                />
                <span className="text-xs text-neutral-600">
                  {search.alerts_enabled ? "Alerts on" : "Alerts off"}
                </span>
              </div>

              {search.alerts_enabled && (
                <Select
                  value={search.alert_frequency}
                  onValueChange={handleFrequencyChange}
                >
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">Instant</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => router.push(buildSearchUrl(search.filters))}
            >
              <Search className="size-3" />
              Run
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => deleteSearch.mutate({ searchId: search.id })}
              disabled={deleteSearch.isPending}
            >
              <Trash2 className="size-3" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
