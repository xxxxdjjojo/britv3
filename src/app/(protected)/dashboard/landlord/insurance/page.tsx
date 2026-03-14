/**
 * 9.27 Insurance — informational page with UK landlord insurance guidance and provider links.
 * Server Component (static/informational content — no client-side state required).
 */

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

export default function InsurancePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Landlord Insurance</h1>
        <p className="mt-2 text-sm text-gray-600">
          Protecting your rental property with the right insurance is essential. As a landlord, a
          standard home insurance policy will not cover you — you need specialist landlord insurance
          that accounts for tenancy risks, rental income, and property liability.
        </p>
      </div>

      {/* Non-commission banner */}
      <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <strong>Note:</strong> Britestate does not earn commission from insurance referrals. The
        providers listed below are displayed for informational purposes only. Prices shown are
        indicative — always get your own quote directly with the insurer.
      </div>

      {/* Cover types */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Types of Cover</h2>
        <div className="space-y-4">
          {COVER_TYPES.map((cover) => (
            <div
              key={cover.title}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">{cover.title}</h3>
                {cover.required ? (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    Usually Required
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    Optional
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{cover.description}</p>
              <p className="mt-2 text-xs text-amber-700 italic">{cover.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Provider comparison table */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">UK Insurance Providers</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Provider
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Products
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Est. Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Highlights
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Quote
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {PROVIDERS.map((provider) => (
                <tr key={provider.name} className="hover:bg-gray-50">
                  <td className="px-4 py-4 font-medium text-gray-900">{provider.name}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {provider.products.map((product) => (
                        <span
                          key={product}
                          className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700"
                        >
                          {product}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-600 whitespace-nowrap">
                    {provider.priceRange}
                  </td>
                  <td className="px-4 py-4 text-gray-600 text-xs max-w-xs">
                    {provider.highlights}
                  </td>
                  <td className="px-4 py-4">
                    <a
                      href={provider.quoteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-md bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-800"
                    >
                      Get Quote
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Prices shown are indicative estimates only. Contact each provider directly for an accurate
          quote based on your property and circumstances.
        </p>
      </section>

      {/* UK-specific tips */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">UK Landlord Insurance Tips</h2>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-green-700">•</span>
              <span>
                <strong>Loft conversions and extensions:</strong> Inform your insurer of any
                structural alterations — failure to disclose can void your buildings insurance.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-green-700">•</span>
              <span>
                <strong>Void periods:</strong> Standard landlord policies often require a 30–90 day
                notification if the property is unoccupied. Extended void periods may need a
                separate unoccupied property policy.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-green-700">•</span>
              <span>
                <strong>Rent guarantee insurance:</strong> Most policies require a satisfactory
                tenant credit check and references as a condition. Policies typically pay out for
                6–12 months while eviction proceedings continue.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-green-700">•</span>
              <span>
                <strong>Legal expenses insurance:</strong> Covers solicitor fees for disputes,
                evictions, and tribunal hearings. Can save thousands of pounds in Section 8 or
                Section 21 proceedings.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-green-700">•</span>
              <span>
                <strong>HMO properties:</strong> Houses in Multiple Occupation require specialist
                HMO insurance — standard landlord policies typically exclude HMO use. Check with
                your provider before letting to multiple separate households.
              </span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
