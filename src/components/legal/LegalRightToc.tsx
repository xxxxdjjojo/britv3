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
      <h4 className="font-heading font-bold text-brand-primary-dark mb-5 text-base">On this page</h4>
      <ul className="flex flex-col gap-4">
        {sections.map(({ id, label }) => {
          const isActive = activeId === id;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                className={
                  isActive
                    ? "font-body text-sm font-medium text-brand-primary hover:text-brand-secondary-dark transition-colors"
                    : "font-body text-sm text-neutral-500 hover:text-brand-primary-dark transition-colors"
                }
                aria-current={isActive ? "location" : undefined}
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
