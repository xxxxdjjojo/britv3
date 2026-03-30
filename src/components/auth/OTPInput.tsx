"use client";

import { useRef, KeyboardEvent, ClipboardEvent } from "react";
import { cn } from "@/lib/utils";

export function OTPInput(
  props: Readonly<{
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    autoFocus?: boolean;
  }>,
) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = props.value.padEnd(6, "").slice(0, 6).split("");

  function focusNext(index: number) {
    if (index < 5) inputRefs.current[index + 1]?.focus();
  }

  function focusPrev(index: number) {
    if (index > 0) inputRefs.current[index - 1]?.focus();
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    props.onChange(next.join(""));
    if (digit) focusNext(index);
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        props.onChange(next.join(""));
      } else {
        focusPrev(index);
      }
    } else if (e.key === "ArrowLeft") {
      focusPrev(index);
    } else if (e.key === "ArrowRight") {
      focusNext(index);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    props.onChange(pasted.padEnd(6, "").slice(0, 6));
    const lastFilledIndex = Math.min(pasted.length, 5);
    inputRefs.current[lastFilledIndex]?.focus();
  }

  return (
    <div className="flex gap-2.5" role="group" aria-label="One-time password">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={props.disabled}
          autoFocus={props.autoFocus && index === 0}
          aria-label={`Digit ${index + 1} of 6`}
          className={cn(
            "h-14 w-12 rounded-xl border-2 border-neutral-200 bg-white text-center",
            "font-mono text-2xl font-bold text-neutral-900",
            "transition-all duration-150",
            "focus:border-brand-primary focus:outline-none focus:ring-4 focus:ring-brand-primary/10",
            "disabled:cursor-not-allowed disabled:opacity-50",
            digit && "border-brand-primary bg-brand-primary/5 text-brand-primary",
          )}
        />
      ))}
    </div>
  );
}
