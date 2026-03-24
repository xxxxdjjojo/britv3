import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";

const SIZE_CLASSES: Record<ContainerSize, string> = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-[1440px]",
};

type ContainerProps = Readonly<{
  size?: ContainerSize;
  className?: string;
  children: React.ReactNode;
  as?: "div" | "section" | "main" | "article";
}>;

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  function Container({ size = "xl", className, children, as: Tag = "div" }, ref) {
    return (
      <Tag
        ref={ref}
        className={cn(
          "mx-auto w-full px-4 sm:px-6 lg:px-8",
          SIZE_CLASSES[size],
          className,
        )}
      >
        {children}
      </Tag>
    );
  },
);
