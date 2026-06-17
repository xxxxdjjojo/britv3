import type { ReactNode } from "react";

type GridCell = Readonly<{ title: string; description?: ReactNode }>;

type LabeledGridProps = Readonly<{
  cells: readonly GridCell[];
  columns?: 2 | 3;
}>;

export function LabeledGrid({ cells, columns = 3 }: LabeledGridProps) {
  const colClass = columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 md:grid-cols-3";
  return (
    <div className={`not-prose grid grid-cols-1 gap-3 ${colClass}`}>
      {cells.map((cell) => (
        <div
          key={cell.title}
          className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
        >
          <p className="text-sm font-semibold text-neutral-900">{cell.title}</p>
          {cell.description ? (
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">{cell.description}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
