"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LeadForm } from "./LeadForm";
import type {
  DevelopmentLeadType,
  DevelopmentUnit,
} from "@/lib/new-homes/types";

const MODES: Record<
  DevelopmentLeadType,
  { cta: string; title: string; description: string }
> = {
  register_interest: {
    cta: "Register interest",
    title: "Register your interest",
    description:
      "Tell the developer a little about your search and they'll keep you updated on availability and launches.",
  },
  book_viewing: {
    cta: "Book a viewing",
    title: "Book a viewing",
    description: "Request a date to visit the development and view the show home.",
  },
  request_brochure: {
    cta: "Request brochure",
    title: "Request the brochure",
    description: "Get the full development brochure with floorplans and specifications sent to you.",
  },
  ask_question: {
    cta: "Ask about incentives",
    title: "Ask a question",
    description: "Ask about incentives, Help to Buy eligibility, or anything else.",
  },
};

const ORDER: DevelopmentLeadType[] = [
  "register_interest",
  "book_viewing",
  "request_brochure",
  "ask_question",
];

export function LeadCtaGroup({
  developmentId,
  developmentName,
  units,
  layout = "inline",
}: Readonly<{
  developmentId: string;
  developmentName: string;
  units: DevelopmentUnit[];
  layout?: "inline" | "stacked" | "single";
}>) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DevelopmentLeadType>("register_interest");

  const openWith = (next: DevelopmentLeadType) => {
    setMode(next);
    setOpen(true);
  };

  const active = MODES[mode];

  return (
    <>
      {layout === "single" ? (
        <Button
          type="button"
          onClick={() => openWith("register_interest")}
          className="bg-brand-primary px-6 hover:bg-brand-primary-light"
        >
          Enquire
        </Button>
      ) : (
        <div
          className={
            layout === "stacked"
              ? "grid grid-cols-1 gap-2"
              : "grid grid-cols-2 gap-2 sm:grid-cols-4"
          }
        >
          {ORDER.map((m, i) => (
            <Button
              key={m}
              type="button"
              variant={i === 0 ? "default" : "outline"}
              onClick={() => openWith(m)}
              className={
                i === 0
                  ? "bg-brand-primary hover:bg-brand-primary-light"
                  : "border-brand-primary/30 text-brand-primary hover:bg-brand-primary/5"
              }
            >
              {MODES[m].cta}
            </Button>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">{active.title}</DialogTitle>
            <DialogDescription>
              {developmentName} — {active.description}
            </DialogDescription>
          </DialogHeader>
          <LeadForm
            key={mode}
            developmentId={developmentId}
            leadType={mode}
            units={units}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
