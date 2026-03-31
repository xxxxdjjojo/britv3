import Link from "next/link";

type AuthLogoProps = Readonly<{
  className?: string;
  /** Show the "Britestate" text next to the icon. Defaults to true. */
  showText?: boolean;
}>;

export function AuthLogo({ className, showText = true }: AuthLogoProps) {
  return (
    <Link
      href="/"
      aria-label="Britestate home"
      className={`flex shrink-0 items-center gap-2.5 ${className ?? ""}`}
    >
      <div className="flex size-9 items-center justify-center rounded-xl bg-brand-primary shadow-sm">
        <span className="font-heading text-sm font-bold text-white">B</span>
      </div>
      {showText && (
        <span className="font-heading text-xl font-bold text-neutral-900">Britestate</span>
      )}
    </Link>
  );
}
