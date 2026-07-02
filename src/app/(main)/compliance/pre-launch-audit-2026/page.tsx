import type { Metadata } from "next";
import Link from "next/link";

import {
  AUDIT_META,
  AUDIT_SECTIONS,
  type AuditBlock,
} from "@/content/compliance/pre-launch-audit-2026";
import { brandConfig, appBaseUrl } from "@/config/brand";

export const metadata: Metadata = {
  title: `${AUDIT_META.title} (${AUDIT_META.auditDateLabel}) | ${brandConfig.displayName}`,
  description:
    "Our full pre-launch compliance and legal due-diligence audit, published gaps and all — regulatory mapping, data mapping, AI compliance, security, and every launch blocker it found.",
  alternates: {
    canonical: `${appBaseUrl()}/compliance/pre-launch-audit-2026`,
  },
  openGraph: {
    title: `${AUDIT_META.title} | ${brandConfig.displayName}`,
    description:
      "We audited ourselves before launch and published the results — including the failing grades.",
  },
};

function AuditBlockView({ block }: Readonly<{ block: AuditBlock }>) {
  if (block.kind === "p") {
    return <p className="leading-relaxed text-neutral-700">{block.text}</p>;
  }

  if (block.kind === "list") {
    const items = block.items.map((item) => (
      <li key={item} className="leading-relaxed text-neutral-700">
        {item}
      </li>
    ));
    return block.ordered ? (
      <ol className="list-decimal space-y-2 pl-5">{items}</ol>
    ) : (
      <ul className="list-disc space-y-2 pl-5">{items}</ul>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200">
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-muted">
            {block.headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-4 py-3 font-semibold text-neutral-900"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row) => (
            <tr
              key={row.join("|")}
              className="border-t border-neutral-200 align-top"
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={`${cellIndex}-${cell}`}
                  className="px-4 py-3 text-neutral-700"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PreLaunchAuditPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-8 flex items-center gap-2 text-sm text-neutral-500"
      >
        <Link href="/" className="transition-colors hover:text-brand-primary">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href="/compliance"
          className="transition-colors hover:text-brand-primary"
        >
          Compliance
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-neutral-900">Pre-launch audit</span>
      </nav>

      <article>
        <header className="mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-primary">
            Compliance library
          </p>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
            {AUDIT_META.title}
          </h1>
          <p className="mt-3 text-sm text-neutral-500">
            Audit date:{" "}
            <time dateTime={AUDIT_META.auditDate}>
              {AUDIT_META.auditDateLabel}
            </time>{" "}
            · Subject: {AUDIT_META.subject}
          </p>

          {/* Plain-English intro */}
          <p className="mt-6 rounded-2xl border border-brand-primary-lighter bg-brand-primary-lighter/40 p-5 leading-relaxed text-neutral-800">
            {AUDIT_META.plainEnglishIntro}
          </p>
        </header>

        {/* Table of contents */}
        <nav
          aria-label="Document sections"
          className="mb-12 rounded-2xl border border-neutral-200 bg-muted p-5"
        >
          <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide text-neutral-900">
            In this document
          </h2>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {AUDIT_SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-sm text-neutral-600 transition-colors hover:text-brand-primary"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {AUDIT_SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="mb-12">
            <h2 className="mb-4 font-heading text-2xl font-bold text-neutral-900">
              {section.title}
            </h2>
            <div className="space-y-4">
              {section.blocks.map((block, index) => (
                <AuditBlockView key={`${section.id}-${index}`} block={block} />
              ))}
            </div>
          </section>
        ))}

        {/* Why we publish this */}
        <footer className="rounded-2xl border border-neutral-200 bg-muted p-6">
          <h2 className="mb-3 font-heading text-lg font-bold text-neutral-900">
            Why we publish this
          </h2>
          <p className="leading-relaxed text-neutral-700">
            {AUDIT_META.whyWePublish}
          </p>
          <p className="mt-4 text-sm text-neutral-500">
            See also{" "}
            <Link
              href="/pledges"
              className="underline decoration-neutral-300 underline-offset-2 hover:text-brand-primary"
            >
              our pledges
            </Link>
            , which turn several of these findings into standing commitments.
          </p>
        </footer>
      </article>
    </div>
  );
}
