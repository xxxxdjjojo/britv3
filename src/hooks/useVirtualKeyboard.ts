"use client";

import { useEffect, useState } from "react";

/**
 * Detects whether the virtual keyboard is likely open.
 * Uses the VirtualKeyboard API where available, otherwise falls back
 * to detecting focus on input/textarea/select elements.
 */
export function useVirtualKeyboard(): boolean {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Try VirtualKeyboard API (Chrome 94+)
    type VirtualKeyboard = {
      overlaysContent: boolean;
      boundingRect: { height: number };
      addEventListener: (event: string, cb: () => void) => void;
      removeEventListener: (event: string, cb: () => void) => void;
    };

    if ("virtualKeyboard" in navigator) {
      const vk = (navigator as unknown as { virtualKeyboard: VirtualKeyboard }).virtualKeyboard;
      vk.overlaysContent = true;
      const handleGeometryChange = () => {
        setIsOpen(vk.boundingRect.height > 0);
      };
      vk.addEventListener("geometrychange", handleGeometryChange);
      return () => vk.removeEventListener("geometrychange", handleGeometryChange);
    }

    // Fallback: detect focus on input elements
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        setIsOpen(true);
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        const active = document.activeElement;
        if (
          !active ||
          (active.tagName !== "INPUT" &&
            active.tagName !== "TEXTAREA" &&
            active.tagName !== "SELECT" &&
            !(active as HTMLElement).isContentEditable)
        ) {
          setIsOpen(false);
        }
      }, 100);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  return isOpen;
}
