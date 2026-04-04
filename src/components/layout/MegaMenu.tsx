"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, navLinkClasses } from "@/config/navigation";
import { MegaMenuItem } from "./MegaMenuItem";

export function MegaMenu() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    setOpenIndex(null);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [close]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [close]);

  const handleTriggerClick = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  const handleMouseEnter = (index: number) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenIndex(index);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpenIndex(null);
    }, 200);
  };

  const handlePanelMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTriggerClick(index);
    }
  };

  const openItem = openIndex !== null ? NAV_ITEMS[openIndex] : null;
  const sections = openItem?.sections ?? [];

  // Grid columns based on section count
  const gridCols =
    sections.length <= 2
      ? "grid-cols-2"
      : sections.length === 3
        ? "grid-cols-3"
        : "grid-cols-4";

  return (
    <nav
      ref={navRef}
      className="hidden items-center gap-1 md:flex relative"
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map((item, index) => (
        <button
          key={item.label}
          type="button"
          className={cn(
            navLinkClasses(),
            "flex items-center gap-1 rounded-lg px-3 py-2 cursor-pointer",
            item.isCta && "text-warning hover:text-warning font-semibold",
            openIndex === index && "text-brand-primary",
          )}
          aria-expanded={openIndex === index}
          onClick={() => handleTriggerClick(index)}
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={handleMouseLeave}
          onKeyDown={(e) => handleKeyDown(e, index)}
        >
          {item.label}
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-200",
              openIndex === index && "rotate-180",
            )}
          />
        </button>
      ))}

      {/* Dropdown panel */}
      {openIndex !== null && sections.length > 0 && (
        <div
          data-testid="mega-menu-panel"
          className={cn(
            "absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[min(90vw,64rem)] z-50",
            "rounded-xl border border-neutral-200 bg-white p-6 shadow-lg",
            "animate-in fade-in slide-in-from-top-2 duration-200",
          )}
          onMouseEnter={handlePanelMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className={cn("grid gap-8", gridCols)}>
            {sections.map((section) => (
              <MegaMenuItem
                key={section.heading}
                section={section}
                onLinkClick={close}
              />
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
