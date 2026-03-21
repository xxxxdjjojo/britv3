"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, SearchIcon } from "lucide-react";
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

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command>
        <CommandInput placeholder="Search pages, tools, services..." />
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
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
