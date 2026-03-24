import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Breakpoint = "default" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type ColCount = 1 | 2 | 3 | 4 | 5 | 6 | 12;
type ResponsiveCols = Partial<Record<Breakpoint, ColCount>>;

const COL_CLASSES: Record<ColCount, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  12: "grid-cols-12",
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

function resolveColsClasses(cols: ColCount | ResponsiveCols): string {
  if (typeof cols === "number") {
    return COL_CLASSES[cols];
  }

  return Object.entries(cols)
    .map(([bp, count]) => {
      const prefix = PREFIX[bp as Breakpoint] ?? "";
      return `${prefix}${COL_CLASSES[count as ColCount]}`;
    })
    .join(" ");
}

const GAP_CLASSES: Record<number, string> = {
  1: "gap-1", 2: "gap-2", 3: "gap-3", 4: "gap-4",
  5: "gap-5", 6: "gap-6", 8: "gap-8", 10: "gap-10", 12: "gap-12",
};

type GridProps = Readonly<{
  cols: ColCount | ResponsiveCols;
  gap?: 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
  className?: string;
  children: React.ReactNode;
}>;

export const Grid = forwardRef<HTMLDivElement, GridProps>(
  function Grid({ cols, gap = 4, className, children }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          resolveColsClasses(cols),
          GAP_CLASSES[gap],
          className,
        )}
      >
        {children}
      </div>
    );
  },
);
