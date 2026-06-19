import { cn } from "@/lib/utils";
import { brandConfig } from "@/config/brand";
import Link from "next/link";

const sizeMap = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
} as const;

export function Logo({
  size = "md",
  variant = "default",
}: Readonly<{
  size?: "sm" | "md" | "lg";
  variant?: "default" | "white";
}>) {
  return (
    <Link href="/" className="inline-flex items-center gap-2">
      <svg
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          "shrink-0",
          size === "sm" && "size-6",
          size === "md" && "size-7",
          size === "lg" && "size-8",
        )}
        aria-hidden="true"
      >
        <rect
          width="28"
          height="28"
          rx="6"
          className={cn(
            variant === "default" ? "fill-brand-primary" : "fill-white",
          )}
        />
        <path
          d="M8 18V10L14 6L20 10V18L14 22L8 18Z"
          className={cn(
            variant === "default" ? "fill-white" : "fill-brand-primary",
          )}
          fillOpacity="0.9"
        />
        <path
          d="M14 6L14 22"
          stroke={variant === "default" ? "#1B4D3E" : "white"}
          strokeWidth="1.5"
          strokeOpacity="0.3"
        />
      </svg>
      <span
        className={cn(
          "font-heading font-bold tracking-tight",
          sizeMap[size],
          variant === "default" ? "text-brand-primary" : "text-white",
        )}
      >
        {brandConfig.displayName}
      </span>
    </Link>
  );
}
