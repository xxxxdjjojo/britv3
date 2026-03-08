import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "size-4 border-2",
  md: "size-6 border-2",
  lg: "size-8 border-[3px]",
} as const;

export function LoadingSpinner({
  size = "md",
  className,
}: Readonly<{
  size?: "sm" | "md" | "lg";
  className?: string;
}>) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "animate-spin rounded-full border-brand-primary/20 border-t-brand-primary",
        sizeMap[size],
        className,
      )}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
