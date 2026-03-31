import Link from "next/link";

type AuthFooterProps = Readonly<{
  className?: string;
}>;

export function AuthFooter({ className }: AuthFooterProps) {
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
