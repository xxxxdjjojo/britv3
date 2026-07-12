/**
 * ReferenceTokenState
 *
 * Terminal-state card shown when an invitation cannot be filled in: expired,
 * already used, declined, or invalid. Copy is friendly but says nothing that
 * would let an attacker distinguish a real-but-consumed token from a fake one
 * beyond the four coarse states (the "invalid" variant leaks nothing).
 *
 * Server-safe (no hooks / interactivity).
 */

import { CheckCircle2, Clock, HelpCircle, XCircle } from "lucide-react";

type Variant = "valid" | "expired" | "used" | "declined" | "invalid";

type Props = Readonly<{
  variant: Variant;
  providerName?: string;
}>;

type StateCopy = {
  icon: typeof CheckCircle2;
  tone: string;
  title: string;
  body: string;
};

function copyFor(variant: Variant, providerName?: string): StateCopy {
  const who = providerName ?? "the trader";
  switch (variant) {
    case "used":
      return {
        icon: CheckCircle2,
        tone: "text-[#1B4D3E]",
        title: "This reference has already been submitted",
        body: "Thank you — there's nothing more you need to do. Your reference has been received and passed on for review.",
      };
    case "expired":
      return {
        icon: Clock,
        tone: "text-amber-600",
        title: "This invitation link has expired",
        body: `For security, reference links are only valid for a limited time. Ask ${who} to send you a new one.`,
      };
    case "declined":
      return {
        icon: XCircle,
        tone: "text-neutral-500",
        title: "You've declined this reference",
        body: "That's completely fine — thank you for letting us know. No further action is needed.",
      };
    // "invalid" and any unexpected state fall through to a generic, non-leaky message.
    default:
      return {
        icon: HelpCircle,
        tone: "text-neutral-500",
        title: "This link is not valid",
        body: "The reference link you followed can't be opened. It may have been mistyped or is no longer active. If you were expecting to leave a reference, please ask the person who contacted you to send a fresh link.",
      };
  }
}

export function ReferenceTokenState({ variant, providerName }: Props) {
  const { icon: Icon, tone, title, body } = copyFor(variant, providerName);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="bg-[#1B4D3E] px-6 py-4">
        <span className="text-sm font-semibold tracking-wide text-white">TrueDeed</span>
      </div>
      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <Icon className={`size-10 ${tone}`} aria-hidden="true" />
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          {body}
        </p>
      </div>
    </div>
  );
}
