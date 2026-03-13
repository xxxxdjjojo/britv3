"use client";

/**
 * ServicesTabWithModal — Client Component wrapper
 *
 * Wraps the server-rendered ServicesTab children alongside the QuoteModal.
 * Uses event delegation on the container: when a button with
 * `data-quote-service` is clicked, the QuoteModal opens with the
 * pre-selected service name.
 */

import { useRef, useState, useCallback } from "react";
import type { ReactNode } from "react";

type ServicesTabWithModalProps = Readonly<{
  children: ReactNode;
  /** QuoteModal component rendered as a child to keep open state local */
  modal: (props: { open: boolean; initialService: string; onOpenChange: (open: boolean) => void }) => ReactNode;
}>;

export function ServicesTabWithModal({ children, modal }: ServicesTabWithModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const button = target.closest("[data-quote-service]") as HTMLElement | null;
    if (button) {
      const serviceName = button.getAttribute("data-quote-service") ?? "";
      setSelectedService(serviceName);
      setOpen(true);
    }
  }, []);

  return (
    <div ref={containerRef} onClick={handleContainerClick}>
      {children}
      {modal({ open, initialService: selectedService, onOpenChange: setOpen })}
    </div>
  );
}
