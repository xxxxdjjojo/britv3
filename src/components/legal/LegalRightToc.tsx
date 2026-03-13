"use client";

import { useEffect, useState } from "react";

type TocSection = {
  id: string;
  label: string;
};

type LegalRightTocProps = Readonly<{
  sections: TocSection[];
}>;

export default function LegalRightToc({ sections }: LegalRightTocProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (sections.length === 0) return;

    const observers: IntersectionObserver[] = [];

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveId(id);
            }
          });
        },
        {
          rootMargin: "0px 0px -60% 0px",
          threshold: 0.4,
        },
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [sections]);

  if (sections.length === 0) return null;

  return (
    <nav aria-label="On this page">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
        On This Page
      </p>
      <ul className="space-y-2">
        {sections.map(({ id, label }) => {
          const isActive = activeId === id;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                className={
                  isActive
                    ? "block border-l-2 border-primary pl-3 text-sm font-medium text-primary"
                    : "block border-l-2 border-transparent pl-3 text-sm text-neutral-500 hover:text-primary transition-colors"
                }
                aria-current={isActive ? "true" : undefined}
              >
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
