import { Building2 } from "lucide-react";

type AuthBrandIconProps = Readonly<{
  className?: string;
}>;

/**
 * Standalone brand icon for centered auth pages.
 * Renders a dark green rounded square with a building icon inside.
 */
export function AuthBrandIcon({ className }: AuthBrandIconProps) {
  return (
    <div className={`flex justify-center ${className ?? ""}`}>
      <div className="flex size-12 items-center justify-center rounded-xl bg-brand-primary shadow-lg shadow-brand-primary/20">
        <Building2 className="size-6 text-white" strokeWidth={1.5} aria-hidden="true" />
      </div>
    </div>
  );
}
