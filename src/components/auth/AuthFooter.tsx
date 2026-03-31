import Link from "next/link";

type AuthFooterProps = Readonly<{
  className?: string;
  /** "inline" = horizontal links only (split layout). "centered" = stacked with copyright (standalone pages). */
  variant?: "inline" | "centered";
}>;

export function AuthFooter({ className, variant = "inline" }: AuthFooterProps) {
  if (variant === "centered") {
    return (
      <div className={`flex flex-col items-center gap-2 ${className ?? ""}`}>
        <p className="font-sans text-xs text-neutral-400">
          © {new Date().getFullYear()} Britestate. Secure encrypted authentication.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/privacy"
            className="font-sans text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-neutral-300" aria-hidden="true">·</span>
          <Link
            href="/terms"
            className="font-sans text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 ${className ?? ""}`}>
      <Link
        href="/privacy"
        className="font-sans text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
      >
        Privacy Policy
      </Link>
      <Link
        href="/terms"
        className="font-sans text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
      >
        Terms
      </Link>
      <Link
        href="/help"
        className="font-sans text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
      >
        Help
      </Link>
    </div>
  );
}
