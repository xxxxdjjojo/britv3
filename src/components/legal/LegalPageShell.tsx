import type { ReactNode } from "react";

import LegalLeftNav from "./LegalLeftNav";
import LegalRightToc from "./LegalRightToc";

type TocSection = { id: string; label: string };

type LegalPageShellProps = Readonly<{
  toc: TocSection[];
  children: ReactNode;
}>;

export function LegalPageShell({ toc, children }: LegalPageShellProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_240px] gap-8 xl:gap-16">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <LegalLeftNav />
        </aside>
        <article className="min-w-0">
          {children}
        </article>
        <aside className="hidden lg:block lg:sticky lg:top-8 lg:self-start">
          <LegalRightToc sections={toc} />
        </aside>
      </div>
    </div>
  );
}
