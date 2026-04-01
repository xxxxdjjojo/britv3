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
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_240px] gap-10 xl:gap-16">
        <aside className="lg:sticky lg:top-28 lg:self-start space-y-8">
          <LegalLeftNav />
          {/* Need Clarification card */}
          <div className="hidden lg:block p-6 border border-neutral-200 rounded-xl bg-white shadow-sm">
            <h4 className="font-heading font-bold text-brand-primary-dark mb-2 text-base">Need Clarification?</h4>
            <p className="font-body text-xs text-neutral-500 leading-relaxed mb-4">
              Our legal team is available to discuss any questions about these documents.
            </p>
            <a
              href="mailto:legal@britestate.co.uk"
              className="font-body text-xs font-bold text-brand-secondary-dark flex items-center gap-1 hover:underline group"
            >
              Contact Legal Team
              <span className="group-hover:translate-x-1 transition-transform" aria-hidden="true">→</span>
            </a>
          </div>
        </aside>
        <article className="min-w-0">
          {children}
        </article>
        <aside className="hidden lg:block lg:sticky lg:top-28 lg:self-start">
          <div className="bg-surface-container-low p-6 rounded-xl mb-6">
            <LegalRightToc sections={toc} />
          </div>
        </aside>
      </div>
    </div>
  );
}
