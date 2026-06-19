"use client";

/**
 * ServicesTabWithModal — Client Component wrapper
 *
 * Wraps the server-rendered ServicesTab children alongside the QuoteModal.
 * Uses event delegation on the container: when a button with
 * `data-quote-service` is clicked, the QuoteModal opens with the
 * pre-selected service name.
 *
 * Takes only serializable props so it can be rendered from a Server Component
 * (the public profile page) without passing a function across the RSC boundary.
 */

import { useRef, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { QuoteModal } from "@/components/providers/QuoteModal";

type ServicesTabWithModalProps = Readonly<{
  children: ReactNode;
  providerId: string;
  providerName: string;
  serviceNames: string[];
}>;

export function ServicesTabWithModal({
  children,
  providerId,
  providerName,
  serviceNames,
}: ServicesTabWithModalProps) {
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
      <QuoteModal
        providerId={providerId}
        providerName={providerName}
        services={serviceNames}
        open={open}
        initialService={selectedService}
        onOpenChange={setOpen}
      />
    </div>
  );
}
