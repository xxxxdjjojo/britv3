import Link from "next/link";
import type {
  DevelopmentIncentive,
  DevelopmentPoi,
  Developer,
} from "@/lib/new-homes/types";
import { formatCompletion } from "@/lib/new-homes/format";

// --- shared section shell ---------------------------------------------------

export function SectionCard({
  id,
  title,
  eyebrow,
  children,
}: Readonly<{
  id?: string;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}>) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
    >
      {eyebrow ? (
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-primary">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mb-4 font-heading text-xl font-semibold text-neutral-900">
        {title}
      </h2>
      {children}
    </section>
  );
}

// --- "Why buyers like this" AI-style summary --------------------------------

export function WhyBuyersBlock({ highlights }: Readonly<{ highlights: string[] }>) {
  if (highlights.length === 0) return null;
  return (
    <section className="rounded-2xl border border-brand-primary/15 bg-[linear-gradient(135deg,#f3f9f6,#eaf4ef)] p-6 shadow-sm">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-brand-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
          <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1M7.7 16.3l-2.1 2.1" strokeLinecap="round" />
        </svg>
        Why buyers like this development
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {highlights.map((point, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5 size-4 shrink-0 text-brand-primary">
              <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {point}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-neutral-400">
        Summary generated from the development&apos;s specification and location data.
      </p>
    </section>
  );
}

// --- incentives -------------------------------------------------------------

export function IncentivesBlock({
  incentives,
}: Readonly<{ incentives: DevelopmentIncentive[] }>) {
  if (incentives.length === 0) return null;
  return (
    <SectionCard title="Incentives & offers" eyebrow="Available now">
      <div className="grid gap-3 sm:grid-cols-2">
        {incentives.map((incentive, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#F0E0BC] bg-[#FDF8EC] p-4"
          >
            <p className="font-semibold text-[#7B5804]">{incentive.title}</p>
            <p className="mt-1 text-sm text-neutral-600">{incentive.detail}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// --- completion timeline ----------------------------------------------------

export function CompletionTimeline({
  completionDate,
}: Readonly<{ completionDate: string | null }>) {
  const ready = formatCompletion(completionDate);
  const steps = [
    { label: "Reserve your plot", detail: "Secure with a reservation fee" },
    { label: "Exchange & build", detail: "Mortgage and legals progress" },
    { label: "Completion", detail: ready ?? "Date confirmed on reservation" },
  ];
  return (
    <SectionCard title="Completion timeline" eyebrow="What to expect">
      <ol className="relative space-y-5 border-l-2 border-neutral-200 pl-5">
        {steps.map((step, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[27px] flex size-5 items-center justify-center rounded-full bg-brand-primary text-[11px] font-bold text-white">
              {i + 1}
            </span>
            <p className="font-semibold text-neutral-900">{step.label}</p>
            <p className="text-sm text-neutral-500">{step.detail}</p>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}

// --- local area -------------------------------------------------------------

function PoiList({
  items,
  icon,
}: Readonly<{ items: DevelopmentPoi[]; icon: React.ReactNode }>) {
  return (
    <ul className="space-y-2">
      {items.map((poi, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <span className="mt-0.5 text-brand-primary">{icon}</span>
          <span>
            <span className="font-medium text-neutral-800">{poi.name}</span>
            {poi.detail ? <span className="text-neutral-500"> — {poi.detail}</span> : null}
            {poi.minutes != null ? (
              <span className="text-neutral-400"> ({poi.minutes} min)</span>
            ) : null}
            {poi.rating ? (
              <span className="ml-1 rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-neutral-500">
                {poi.rating}
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function LocalAreaBlock({
  transport,
  schools,
  amenities,
}: Readonly<{
  transport: DevelopmentPoi[];
  schools: DevelopmentPoi[];
  amenities: DevelopmentPoi[];
}>) {
  if (transport.length + schools.length + amenities.length === 0) return null;
  const dot = (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-2.5">
      <circle cx="12" cy="12" r="6" />
    </svg>
  );
  return (
    <SectionCard title="Transport, schools & local area" eyebrow="Location">
      <div className="grid gap-6 sm:grid-cols-3">
        {transport.length > 0 ? (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-neutral-700">Transport</h3>
            <PoiList items={transport} icon={dot} />
          </div>
        ) : null}
        {schools.length > 0 ? (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-neutral-700">Schools</h3>
            <PoiList items={schools} icon={dot} />
          </div>
        ) : null}
        {amenities.length > 0 ? (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-neutral-700">Amenities</h3>
            <PoiList items={amenities} icon={dot} />
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}

// --- developer trust / profile ----------------------------------------------

function safeUrl(url: string | null): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (["http:", "https:"].includes(parsed.protocol)) return url;
  } catch {
    return undefined;
  }
  return undefined;
}

export function DeveloperProfileBlock({ developer }: Readonly<{ developer: Developer }>) {
  const website = safeUrl(developer.websiteUrl);
  const stats = [
    developer.yearEstablished
      ? { value: `Est. ${developer.yearEstablished}`, label: "Established" }
      : null,
    developer.homesBuilt
      ? { value: `${developer.homesBuilt.toLocaleString()}+`, label: "Homes built" }
      : null,
    developer.regions.length > 0
      ? { value: `${developer.regions.length}`, label: "Regions" }
      : null,
  ].filter(Boolean) as { value: string; label: string }[];

  return (
    <SectionCard title="About the developer" eyebrow="Trusted developer">
      <div className="flex items-center gap-3">
        <span
          className="flex size-12 items-center justify-center rounded-xl text-lg font-bold text-white"
          style={{ backgroundColor: developer.brandColour ?? "#1B4D3E" }}
        >
          {developer.name.charAt(0)}
        </span>
        <div>
          <p className="font-heading text-lg font-semibold text-neutral-900">
            {developer.name}
          </p>
          {developer.tagline ? (
            <p className="text-sm text-neutral-500">{developer.tagline}</p>
          ) : null}
        </div>
      </div>
      {developer.about ? (
        <p className="mt-4 text-sm leading-relaxed text-neutral-600">{developer.about}</p>
      ) : null}
      {stats.length > 0 ? (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-muted p-3 text-center">
              <p className="font-heading text-lg font-bold text-brand-primary">{s.value}</p>
              <p className="text-xs text-neutral-500">{s.label}</p>
            </div>
          ))}
        </div>
      ) : null}
      {website ? (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm font-semibold text-brand-primary hover:underline"
        >
          Visit developer website →
        </a>
      ) : null}
    </SectionCard>
  );
}

// --- mortgage affordability CTA ---------------------------------------------

export function MortgageCtaBlock() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-brand-primary-dark p-6 text-white shadow-sm">
      <h2 className="font-heading text-lg font-semibold">Can you afford it?</h2>
      <p className="mt-1 text-sm text-white/70">
        Check your monthly payments and borrowing power with our free calculators.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/tools/mortgage-calculator"
          className="inline-flex h-10 items-center rounded-lg bg-brand-gold px-4 text-sm font-semibold text-[#7B5804] hover:bg-brand-gold/90"
        >
          Mortgage calculator
        </Link>
        <Link
          href="/tools/affordability-calculator"
          className="inline-flex h-10 items-center rounded-lg border border-white/30 px-4 text-sm font-semibold text-white hover:bg-white/10"
        >
          Affordability calculator
        </Link>
      </div>
    </div>
  );
}