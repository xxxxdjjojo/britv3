import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Direction = "row" | "col";
type Breakpoint = "default" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type ResponsiveDirection = Partial<Record<Breakpoint, Direction>>;

const DIR_CLASSES: Record<Direction, string> = {
  row: "flex-row",
  col: "flex-col",
};

const PREFIX: Record<Breakpoint, string> = {
  default: "",
  xs: "xs:",
  sm: "sm:",
  md: "md:",
  lg: "lg:",
  xl: "xl:",
  "2xl": "2xl:",
};

const ALIGN_MAP: Record<string, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

const JUSTIFY_MAP: Record<string, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

function resolveDirectionClasses(dir: Direction | ResponsiveDirection): string {
  if (typeof dir === "string") {
    return DIR_CLASSES[dir];
  }
  return Object.entries(dir)
    .map(([bp, d]) => `${PREFIX[bp as Breakpoint] ?? ""}${DIR_CLASSES[d as Direction]}`)
    .join(" ");
}

const GAP_CLASSES: Record<number, string> = {
  0: "gap-0", 1: "gap-1", 2: "gap-2", 3: "gap-3", 4: "gap-4",
  5: "gap-5", 6: "gap-6", 8: "gap-8", 10: "gap-10", 12: "gap-12",
};

type StackProps = Readonly<{
  direction?: Direction | ResponsiveDirection;
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: boolean;
  className?: string;
  children: React.ReactNode;
  as?: "div" | "section" | "nav" | "ul";
}>;

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  function Stack(
    { direction = "col", gap = 4, align, justify, wrap, className, children, as: Tag = "div" },
    ref,
  ) {
    return (
      <Tag
        ref={ref}
        className={cn(
          "flex",
          resolveDirectionClasses(direction),
          GAP_CLASSES[gap],
          align && ALIGN_MAP[align],
          justify && JUSTIFY_MAP[justify],
          wrap && "flex-wrap",
          className,
        )}
      >
        {children}
      </Tag>
    );
  },
);
