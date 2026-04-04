/**
 * 9.27 Insurance — informational page with UK landlord insurance guidance and provider links.
 * Server Component (static/informational content — no client-side state required).
 */

import { Info, ShieldCheck, ShieldAlert, Shield, ExternalLink, CheckCircle2 } from "lucide-react";

type InsuranceProvider = {
  name: string;
  products: string[];
  priceRange: string;
  highlights: string;
  quoteUrl: string;
};

const PROVIDERS: InsuranceProvider[] = [
  {
    name: "Direct Line Landlord",
    products: ["Buildings", "Contents", "Liability", "Rent Guarantee"],
    priceRange: "From ~£150/year",
    highlights: "Buildings & contents cover; optional rent guarantee; 24/7 emergency helpline",
    quoteUrl: "https://www.directline.com/landlord-insurance",
  },
  {
    name: "AXA Landlord",
    products: ["Buildings", "Liability", "Accidental Damage"],
    priceRange: "From ~£170/year",
    highlights: "Award-winning cover; new-for-old contents; multi-property discounts available",
    quoteUrl: "https://www.axa.co.uk/landlord-insurance/",
  },
  {
    name: "LV= Landlord",
    products: ["Buildings", "Contents", "Legal Expenses", "Rent Guarantee"],
    priceRange: "From ~£160/year",
    highlights: "Flexible buildings sum insured; legal expenses add-on; online account management",
    quoteUrl: "https://www.lv.com/insurance/home/landlord",
  },
  {
    name: "Admiral Landlord",
    products: ["Buildings", "Contents", "Accidental Damage"],
    priceRange: "From ~£140/year",
    highlights: "Competitive pricing; combined buildings & contents option; no admin fees",
    quoteUrl: "https://www.admiral.com/insurance/landlord",
  },
  {
    name: "Aviva Landlord",
    products: ["Buildings", "Contents", "Liability", "Rent Protection"],
    priceRange: "From ~£155/year",
    highlights: "Up to £10m public liability; rent protection available; 24-hour emergency cover",
    quoteUrl: "https://www.aviva.co.uk/insurance/home/landlords-insurance/",
  },
];

type CoverType = {
  title: string;
  description: string;
  required: boolean;
  note: string;
};

const COVER_TYPES: CoverType[] = [
  {
    title: "Buildings Insurance",
    description:
      "Covers the structure of the property — walls, roof, floors, and fixtures — against damage from fire, flood, storm, subsidence, and other insured perils.",
    required: true,
    note: "Typically required if the property is mortgaged. Your lender will usually insist on buildings insurance as a condition of the mortgage.",
  },
  {
    title: "Contents Insurance",
    description:
      "Covers furnishings, appliances, and other items you provide to your tenant. Only relevant if you let a furnished or part-furnished property.",
    required: false,
    note: "Optional for unfurnished lets. Tenants are responsible for insuring their own belongings.",
  },
  {
    title: "Landlord Liability Insurance",
    description:
      "Protects you if a tenant or visitor suffers an injury or property damage at your rental and holds you legally responsible.",
    required: false,
    note: "Strongly recommended — a single liability claim can easily exceed six figures.",
  },
  {
    title: "Rent Guarantee Insurance",
    description:
      "Covers your rental income if the tenant fails to pay. Usually includes legal expenses to cover eviction proceedings.",
    required: false,
    note: "Requires a satisfactory tenant reference check. Typically covers 6–12 months of rent while proceedings continue.",
  },
  {
    title: "Legal Expenses Insurance",
    description:
      "Covers solicitor fees and court costs for disputes with tenants — including eviction, deposit disputes, and property damage claims.",
    required: false,
    note: "Often bundled with rent guarantee insurance. Invaluable if possession proceedings are needed.",
  },
];

const UK_TIPS = [
  {
    title: "Loft conversions and extensions",
    body: "Inform your insurer of any structural alterations — failure to disclose can void your buildings insurance.",
  },
  {
    title: "Void periods",
    body: "Standard landlord policies often require a 30–90 day notification if the property is unoccupied. Extended void periods may need a separate unoccupied property policy.",
  },
  {
    title: "Rent guarantee insurance",
    body: "Most policies require a satisfactory tenant credit check and references as a condition. Policies typically pay out for 6–12 months while eviction proceedings continue.",
  },
  {
    title: "Legal expenses insurance",
    body: "Covers solicitor fees for disputes, evictions, and tribunal hearings. Can save thousands of pounds in Section 8 or Section 21 proceedings.",
  },
  {
    title: "HMO properties",
    body: "Houses in Multiple Occupation require specialist HMO insurance — standard landlord policies typically exclude HMO use. Check with your provider before letting to multiple separate households.",
  },
];

export default function InsurancePage() {
  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Property Insurance
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Protect your portfolio with the right landlord insurance cover across buildings, contents, liability, and rent guarantee.
        </p>
      </div>

      {/* Non-commission banner */}
      <div className="flex items-start gap-3 rounded-xl border border-brand-accent/30 bg-brand-accent-light p-4 dark:border-brand-accent/20 dark:bg-brand-accent/10">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-accent dark:text-brand-accent" />
        <p className="text-sm text-brand-accent dark:text-brand-accent">
          <strong>Independent guidance:</strong> Britestate does not earn commission from insurance
          referrals. The providers listed below are displayed for informational purposes only. Prices
          shown are indicative — always get your own quote directly with the insurer.
        </p>
      </div>

      {/* Cover types */}
      <section>
        <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">
          Types of Cover
        </h2>
        <div className="space-y-3">
          {COVER_TYPES.map((cover) => (
            <div
              key={cover.title}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="flex items-start gap-3 p-5">
                <span className={`mt-0.5 rounded-lg p-1.5 ${cover.required ? "bg-error-light dark:bg-error/10" : "bg-muted"}`}>
                  {cover.required
                    ? <ShieldAlert className="size-4 text-error dark:text-error" />
                    : <Shield className="size-4 text-muted-foreground" />
                  }
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-sm font-semibold text-foreground">
                      {cover.title}
                    </h3>
                    {cover.required ? (
                      <span className="rounded-full bg-error-light px-2.5 py-0.5 text-xs font-semibold text-error dark:bg-error/10 dark:text-error">
                        Usually Required
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        Optional
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{cover.description}</p>
                  <p className="mt-2 text-xs italic text-warning dark:text-warning">{cover.note}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Provider comparison */}
      <section>
        <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">
          UK Insurance Providers
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Provider
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Products
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Est. Price
                  </th>
                  <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">
                    Highlights
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Quote
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {PROVIDERS.map((provider) => (
                  <tr key={provider.name} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-4 font-medium text-foreground whitespace-nowrap">
                      {provider.name}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {provider.products.map((product) => (
                          <span
                            key={product}
                            className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs font-medium text-brand-primary dark:bg-primary/20 dark:text-primary"
                          >
                            {product}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-foreground whitespace-nowrap font-medium">
                      {provider.priceRange}
                    </td>
                    <td className="hidden px-5 py-4 text-xs text-muted-foreground max-w-xs lg:table-cell">
                      {provider.highlights}
                    </td>
                    <td className="px-5 py-4">
                      <a
                        href={provider.quoteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-primary/90 dark:bg-primary dark:hover:bg-primary/90"
                      >
                        Get Quote
                        <ExternalLink className="size-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Prices shown are indicative estimates only. Contact each provider directly for an accurate
          quote based on your property and circumstances.
        </p>
      </section>

      {/* UK-specific tips */}
      <section>
        <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">
          UK Landlord Insurance Tips
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <ul className="divide-y divide-border">
            {UK_TIPS.map((tip) => (
              <li key={tip.title} className="flex items-start gap-3 p-5">
                <span className="mt-0.5 rounded-lg bg-brand-primary/10 p-1.5 dark:bg-primary/20">
                  <ShieldCheck className="size-3.5 text-brand-primary dark:text-primary" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{tip.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{tip.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Summary CTA */}
      <div className="rounded-2xl border border-brand-primary/20 bg-brand-primary/5 p-6 dark:border-primary/20 dark:bg-primary/5">
        <div className="flex items-start gap-4">
          <span className="rounded-xl bg-brand-primary/10 p-2.5 dark:bg-primary/20">
            <CheckCircle2 className="size-5 text-brand-primary dark:text-primary" />
          </span>
          <div>
            <h3 className="font-heading text-base font-semibold text-foreground">
              Review your cover annually
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Insurance needs change as your portfolio grows. Set a reminder each year to compare
              policies and ensure your cover remains adequate — especially after any renovations,
              new tenancies, or changes to your mortgage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
