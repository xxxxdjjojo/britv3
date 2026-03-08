"use client";

/**
 * Quick action buttons grid for dashboards.
 * Renders a configurable list of CTA buttons.
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type QuickAction = {
  label: string;
  href: string;
  icon: LucideIcon;
  variant?: "default" | "outline";
};

export function QuickActions({
  actions,
  title = "Quick Actions",
}: Readonly<{
  actions: QuickAction[];
  title?: string;
}>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading">
          <Zap className="size-5 text-brand-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {actions.map((action, i) => (
          <Button
            key={action.label}
            variant={action.variant ?? (i === 0 ? "default" : "outline")}
            size="lg"
            className="w-full justify-start gap-2"
            render={<Link href={action.href} />}
          >
            <action.icon className="size-4" />
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
