"use client";

import { useEffect, useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, SearchIcon, Building2, Users, Wrench, Loader2 } from "lucide-react";
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { COMMAND_PALETTE_ROUTES } from "@/config/navigation";
import { useCommandPalette } from "@/contexts/CommandPaletteContext";

type SearchResult = {
  type: "property" | "tenant" | "maintenance";
  id: string;
  label: string;
  sublabel: string;
  href: string;
};

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const router = useRouter();

  // Group routes by section (memoized)
  const groupedRoutes = useMemo(() => {
    const groups = new Map<string, typeof COMMAND_PALETTE_ROUTES>();
    for (const route of COMMAND_PALETTE_ROUTES) {
      const existing = groups.get(route.section) ?? [];
      existing.push(route);
      groups.set(route.section, existing);
    }
    return groups;
  }, []);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced entity search
  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/dashboard/search?q=${encodeURIComponent(query)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results ?? []);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset search state when palette closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setSearchResults([]);
    }
  }, [open]);

  // Handle Cmd+K / Ctrl+K
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        // Don't open when focused in input/textarea
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea") {
          return;
        }
        e.preventDefault();
        setOpen(!open);
      }
    },
    [open, setOpen],
  );

  // Handle custom event from SearchTrigger
  const handleCustomOpen = useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener(
      "open-command-palette",
      handleCustomOpen,
    );
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener(
        "open-command-palette",
        handleCustomOpen,
      );
    };
  }, [handleKeyDown, handleCustomOpen]);

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router, setOpen],
  );

  function ResultIcon({ type }: { type: string }) {
    switch (type) {
      case "property":
        return <Building2 className="size-4 text-muted-foreground" />;
      case "tenant":
        return <Users className="size-4 text-muted-foreground" />;
      case "maintenance":
        return <Wrench className="size-4 text-muted-foreground" />;
      default:
        return <SearchIcon className="size-4 text-muted-foreground" />;
    }
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command>
        <CommandInput placeholder="Search pages, properties, tenants..." onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {Array.from(groupedRoutes.entries()).map(([section, routes]) => (
            <CommandGroup key={section} heading={section}>
              {routes.map((route) => (
                <CommandItem
                  key={route.href}
                  value={`${route.label} ${route.keywords.join(" ")}`}
                  onSelect={() => handleSelect(route.href)}
                >
                  <SearchIcon className="size-4 text-muted-foreground" />
                  <span className="flex-1">{route.label}</span>
                  <ArrowRight className="size-3 text-muted-foreground opacity-0 group-data-selected/command-item:opacity-100" />
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
          {searchResults.length > 0 && (
            <CommandGroup heading="Search Results">
              {searchResults.map((result) => (
                <CommandItem
                  key={`search-${result.type}-${result.id}`}
                  value={`search ${result.label} ${result.sublabel}`}
                  onSelect={() => handleSelect(result.href)}
                >
                  <ResultIcon type={result.type} />
                  <div className="flex-1 min-w-0">
                    <span className="block truncate">{result.label}</span>
                    {result.sublabel && (
                      <span className="block text-xs text-muted-foreground truncate">
                        {result.sublabel}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {result.type}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {isSearching && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Searching...
            </div>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
