"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type CommandPaletteContextValue = Readonly<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>;

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null,
);

export function CommandPaletteProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [open, setOpen] = useState(false);

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error(
      "useCommandPalette must be used within a CommandPaletteProvider",
    );
  }
  return ctx;
}
