"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calculator, TrendingUp, Users } from "lucide-react";
import { AffordMode } from "./AffordMode";
import { RequiredIncomeMode } from "./RequiredIncomeMode";
import { RoommateMode } from "./RoommateMode";

type Mode = "afford" | "required" | "roommate";

const TRIGGER_CLASS =
  "flex items-center gap-2 py-2.5 data-active:bg-primary data-active:text-primary-foreground";

export function ModeTabs() {
  const [mode, setMode] = useState<Mode>("afford");

  return (
    <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
      <TabsList className="mx-auto grid h-auto w-full max-w-2xl grid-cols-3 p-1">
        <TabsTrigger value="afford" className={TRIGGER_CLASS}>
          <Calculator className="size-4" />
          <span className="hidden sm:inline">Can I afford it?</span>
          <span className="sm:hidden">Afford</span>
        </TabsTrigger>
        <TabsTrigger value="required" className={TRIGGER_CLASS}>
          <TrendingUp className="size-4" />
          <span className="hidden sm:inline">Required income</span>
          <span className="sm:hidden">Income</span>
        </TabsTrigger>
        <TabsTrigger value="roommate" className={TRIGGER_CLASS}>
          <Users className="size-4" />
          <span className="hidden sm:inline">Roommate split</span>
          <span className="sm:hidden">Split</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="afford" className="mt-6">
        <AffordMode />
      </TabsContent>
      <TabsContent value="required" className="mt-6">
        <RequiredIncomeMode />
      </TabsContent>
      <TabsContent value="roommate" className="mt-6">
        <RoommateMode />
      </TabsContent>
    </Tabs>
  );
}
