import type { Metadata } from "next";
import Link from "next/link";
import {
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Train,
  GraduationCap,
  Trees,
  Map,
  Heart,
  Download,
  Wrench,
  Building2,
  Calculator,
} from "lucide-react";

type CityPageProps = Readonly<{
  params: Promise<{ city: string }>;
}>;

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { city } = await params;
  const name = city.charAt(0).toUpperCase() + city.slice(1);
  return {
    title: `Properties in ${name} | Britestate`,
    description: `Browse properties for sale and to rent in ${name}. View area guides, market trends, and local services.`,
  };
}

const BOROUGHS = [
  { name: "Westminster", avgPrice: "1.2M", zone: "Zone 1" },
  { name: "Camden", avgPrice: "850k", zone: "Zone 2" },
  { name: "Islington", avgPrice: "780k", zone: "Zone 2" },
  { name: "Hackney", avgPrice: "650k", zone: "Zone 2" },
  { name: "Shoreditch", avgPrice: "720k", zone: "Zone 1" },
  { name: "Clapham", avgPrice: "680k", zone: "Zone 2" },
  { name: "Greenwich", avgPrice: "520k", zone: "Zone 3" },
  { name: "Brixton", avgPrice: "590k", zone: "Zone 2" },
] as const;

const SALE_PROPERTIES = [
  {
    price: "1,450,000",
    address: "Elizabeth St, Belgravia, SW1W",
    beds: 3,
    baths: 2,
    sqft: "1,240",
    tag: "Premium",
    tagColor: "bg-brand-primary",
  },
  {
    price: "875,000",
    address: "Tufnell Park Road, Islington, N7",
    beds: 2,
    baths: 1,
    feature: "Garden",
  },
  {
    price: "620,000",
    address: "Harbour Way, Canary Wharf, E14",
    beds: 1,
    baths: 1,
    feature: "Gym",
    tag: "New Build",
    tagColor: "bg-emerald-500",
  },
  {
    price: "950,000",
    address: "Kensington High St, W8",
    beds: 3,
    baths: 2,
    sqft: "1,100",
  },
] as const;

const RENT_PROPERTIES = [
  {
    price: "2,800",
    period: "pcm",
    address: "Shoreditch High St, E1",
    beds: 2,
    baths: 1,
    feature: "Balcony",
  },
  {
    price: "1,950",
    period: "pcm",
    address: "Brixton Road, SW9",
    beds: 1,
    baths: 1,
    sqft: "580",
  },
  {
    price: "3,500",
    period: "pcm",
    address: "Greenwich Pier, SE10",
    beds: 3,
    baths: 2,
    feature: "River Views",
    tag: "Featured",
    tagColor: "bg-brand-primary",
  },
  {
    price: "4,200",
    period: "pcm",
    address: "Marylebone Lane, W1U",
    beds: 2,
    baths: 2,
    sqft: "920",
  },
] as const;

const SERVICE_CATEGORIES = [
  {
    icon: Wrench,
    title: "Home Services",
    description: "Plumbers, electricians, and builders vetted by us.",
    count: 240,
  },
  {
    icon: Building2,
    title: "Estate Agents",
    description: "Local experts for buying, selling, and letting.",
    count: 354,
  },
  {
    icon: Calculator,
    title: "Financial Advisors",
    description: "Mortgage brokers and financial planners.",
    count: 156,
  },
] as const;

export default async function CityAreaGuidePage({ params }: CityPageProps) {
  const { city } = await params;
  const cityName = city.charAt(0).toUpperCase() + city.slice(1);
  const citySlug = city.toLowerCase();

  return (
    <>
      {/* ── Hero Section ── */}
      <header className="relative h-[500px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-neutral-300" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <nav className="flex mb-4 text-white/80 text-sm gap-2" aria-label="Breadcrumb">
              <Link className="hover:underline" href="/">Home</Link>
              <span aria-hidden="true">/</span>
              <Link className="hover:underline" href="/areas">Areas</Link>
              <span aria-hidden="true">/</span>
              <span className="text-white font-medium">{cityName}</span>
            </nav>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight font-heading">
              Properties in <br /><span className="text-brand-primary-light">{cityName}</span>
            </h1>
            <p className="text-lg text-neutral-200 mb-8 max-w-lg">
              Discover your perfect home in the heart of the UK. From riverside penthouses to historic townhouses in {cityName}.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={`/search?city=${citySlug}`}
                className="flex-grow bg-white dark:bg-neutral-900 p-1.5 rounded-xl shadow-xl flex items-center"
              >
                <MapPin className="size-5 text-neutral-400 mx-3" />
                <span className="w-full text-neutral-400 text-base py-2.5">
                  Search specific {cityName} areas...
                </span>
                <span className="bg-brand-primary text-white px-6 py-2.5 rounded-lg font-semibold">
                  Search
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Stats Ribbon ── */}
      <div className="relative z-20 -mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200/50 dark:border-neutral-800 p-6 md:p-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Avg Price</p>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">&pound;725,400</h3>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">YoY Change</p>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold text-emerald-500">+4.2%</h3>
              <TrendingUp className="size-4 text-emerald-500" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Total Listings</p>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">12,400</h3>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Avg Days to Sell</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">34 days</h3>
              <span className="text-xs text-amber-500 font-medium">-6% vs 2025</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">

        {/* ── Popular Boroughs ── */}
        <section>
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2 font-heading">Popular Boroughs</h2>
              <p className="text-neutral-500">The most searched neighbourhoods this month</p>
            </div>
            <Link
              className="text-brand-primary font-semibold flex items-center gap-1 hover:gap-2 transition-all"
              href={`/areas/${citySlug}/all`}
            >
              View all Boroughs <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BOROUGHS.map((borough) => (
              <Link
                key={borough.name}
                href={`/areas/${citySlug}/${borough.name.toLowerCase()}`}
                className="group relative overflow-hidden rounded-xl bg-neutral-900 aspect-[4/5] cursor-pointer"
              >
                <div className="w-full h-full bg-neutral-400 opacity-70 group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <h4 className="text-xl font-bold text-white mb-1">{borough.name}</h4>
                  <div className="flex justify-between items-center">
                    <p className="text-white/80 text-sm">Avg. &pound;{borough.avgPrice}</p>
                    <span className="text-brand-primary text-xs font-bold bg-white px-2 py-0.5 rounded">
                      {borough.zone}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Properties For Sale ── */}
        <section>
          <div className="flex items-center gap-3 mb-10">
            <h2 className="text-3xl font-bold font-heading">Properties For Sale</h2>
            <div className="h-px flex-grow bg-neutral-200 dark:bg-neutral-800" />
            <Link
              href={`/search?city=${citySlug}&type=buy`}
              className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SALE_PROPERTIES.map((property) => (
              <div
                key={property.address}
                className="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-shadow"
              >
                <div className="relative h-52">
                  <div className="w-full h-full bg-neutral-200" />
                  {"tag" in property && property.tag && (
                    <div className={`absolute top-4 left-4 ${property.tagColor} text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest`}>
                      {property.tag}
                    </div>
                  )}
                  <button
                    className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/40"
                    aria-label="Save property"
                  >
                    <Heart className="size-5" />
                  </button>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">
                    &pound;{property.price}
                  </h3>
                  <p className="text-neutral-500 text-sm mb-4">{property.address}</p>
                  <div className="flex items-center gap-4 text-neutral-600 dark:text-neutral-400">
                    <div className="flex items-center gap-1">
                      <Bed className="size-4" />
                      <span className="text-sm font-medium">{property.beds} Bed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="size-4" />
                      <span className="text-sm font-medium">{property.baths} Bath</span>
                    </div>
                    {"sqft" in property && property.sqft && (
                      <div className="flex items-center gap-1">
                        <Maximize2 className="size-4" />
                        <span className="text-sm font-medium">{property.sqft} sqft</span>
                      </div>
                    )}
                    {"feature" in property && property.feature && (
                      <span className="text-sm font-medium text-brand-primary">{property.feature}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <Link
              href={`/search?city=${citySlug}&type=buy`}
              className="inline-flex items-center gap-2 text-brand-primary font-semibold hover:underline"
            >
              View All Results <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        {/* ── Properties To Rent ── */}
        <section>
          <div className="flex items-center gap-3 mb-10">
            <h2 className="text-3xl font-bold font-heading">Properties To Rent</h2>
            <div className="h-px flex-grow bg-neutral-200 dark:bg-neutral-800" />
            <Link
              href={`/search?city=${citySlug}&type=rent`}
              className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {RENT_PROPERTIES.map((property) => (
              <div
                key={property.address}
                className="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-shadow"
              >
                <div className="relative h-52">
                  <div className="w-full h-full bg-neutral-200" />
                  {"tag" in property && property.tag && (
                    <div className={`absolute top-4 left-4 ${property.tagColor} text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest`}>
                      {property.tag}
                    </div>
                  )}
                  <button
                    className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/40"
                    aria-label="Save property"
                  >
                    <Heart className="size-5" />
                  </button>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">
                    &pound;{property.price} <span className="text-sm font-normal text-neutral-500">{property.period}</span>
                  </h3>
                  <p className="text-neutral-500 text-sm mb-4">{property.address}</p>
                  <div className="flex items-center gap-4 text-neutral-600 dark:text-neutral-400">
                    <div className="flex items-center gap-1">
                      <Bed className="size-4" />
                      <span className="text-sm font-medium">{property.beds} Bed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="size-4" />
                      <span className="text-sm font-medium">{property.baths} Bath</span>
                    </div>
                    {"sqft" in property && property.sqft && (
                      <div className="flex items-center gap-1">
                        <Maximize2 className="size-4" />
                        <span className="text-sm font-medium">{property.sqft} sqft</span>
                      </div>
                    )}
                    {"feature" in property && property.feature && (
                      <span className="text-sm font-medium text-brand-primary">{property.feature}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <Link
              href={`/search?city=${citySlug}&type=rent`}
              className="inline-flex items-center gap-2 text-brand-primary font-semibold hover:underline"
            >
              View All Results <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        {/* ── Market Overview / 5-Year Price Trend ── */}
        <section>
          <div className="grid lg:grid-cols-3 gap-12 items-center">
            <div className="lg:col-span-1 space-y-6">
              <div className="inline-block px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-bold tracking-widest uppercase">
                Market Report 2026
              </div>
              <h2 className="text-3xl font-bold font-heading">{cityName} Price Trends</h2>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                The {cityName} property market continues to show resilience despite global economic shifts.
                Demand remains strong in Zone 2 and 3, particularly in areas with improved Elizabeth Line connectivity.
                Investor interest is pivoting towards higher-yielding outer boroughs as central capital growth stabilises.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm font-medium">
                  <CheckCircle2 className="size-4 text-brand-primary" />
                  Highest growth in South-East {cityName}
                </li>
                <li className="flex items-center gap-3 text-sm font-medium">
                  <CheckCircle2 className="size-4 text-brand-primary" />
                  Rental demand up 12% across Greater {cityName}
                </li>
              </ul>
              <Link
                href="#"
                className="flex items-center gap-2 text-brand-primary font-bold hover:underline"
              >
                Download Full Report <Download className="size-4" />
              </Link>
            </div>
            <div className="lg:col-span-2 bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 h-[400px] relative">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-bold text-neutral-800 dark:text-neutral-200">5-Year Average Property Value</h3>
                <div className="flex gap-4">
                  <span className="flex items-center gap-2 text-xs font-medium">
                    <span className="w-3 h-3 bg-brand-primary rounded-full" /> {cityName} Avg
                  </span>
                  <span className="flex items-center gap-2 text-xs font-medium">
                    <span className="w-3 h-3 bg-neutral-300 rounded-full" /> UK Avg
                  </span>
                </div>
              </div>
              {/* Chart placeholder */}
              <div className="relative w-full h-64 flex items-end justify-between px-2">
                <div className="absolute inset-0 flex flex-col justify-between py-2 text-neutral-300 dark:text-neutral-700 pointer-events-none">
                  <div className="border-b border-neutral-100 dark:border-neutral-800 w-full" />
                  <div className="border-b border-neutral-100 dark:border-neutral-800 w-full" />
                  <div className="border-b border-neutral-100 dark:border-neutral-800 w-full" />
                  <div className="border-b border-neutral-100 dark:border-neutral-800 w-full" />
                </div>
                <div className="relative w-full h-full">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 800 200">
                    <path
                      d="M0,180 Q100,160 200,140 T400,100 T600,60 T800,20"
                      fill="none"
                      stroke="var(--color-brand-primary)"
                      strokeLinecap="round"
                      strokeWidth="4"
                    />
                    <path
                      d="M0,195 Q100,185 200,175 T400,150 T600,130 T800,110"
                      fill="none"
                      stroke="var(--color-neutral-300)"
                      strokeDasharray="8 8"
                      strokeLinecap="round"
                      strokeWidth="3"
                    />
                    <circle
                      cx="400"
                      cy="100"
                      fill="var(--color-brand-primary)"
                      r="6"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex justify-between mt-4 px-2 text-xs font-bold text-neutral-400">
                <span>2022</span>
                <span>2023</span>
                <span>2024</span>
                <span>2025</span>
                <span>2026 (Proj)</span>
              </div>
            </div>
          </div>

          {/* Mock data table */}
          <div className="mt-8 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="p-6">
              <h3 className="font-bold text-lg mb-4 font-heading">Price History Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                      <th className="text-left py-3 px-4 font-semibold text-neutral-500">Year</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-500">Avg Price</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-500">Change</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-500">Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { year: "2026 (Proj)", price: "725,400", change: "+4.2%", transactions: "12,400", positive: true },
                      { year: "2025", price: "696,200", change: "+3.8%", transactions: "11,800", positive: true },
                      { year: "2024", price: "670,700", change: "+2.1%", transactions: "10,900", positive: true },
                      { year: "2023", price: "656,900", change: "-1.4%", transactions: "9,200", positive: false },
                      { year: "2022", price: "666,200", change: "+6.3%", transactions: "13,100", positive: true },
                    ].map((row) => (
                      <tr key={row.year} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                        <td className="py-3 px-4 font-medium">{row.year}</td>
                        <td className="text-right py-3 px-4">&pound;{row.price}</td>
                        <td className={`text-right py-3 px-4 font-medium ${row.positive ? "text-emerald-500" : "text-red-500"}`}>
                          {row.change}
                        </td>
                        <td className="text-right py-3 px-4 text-neutral-500">{row.transactions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* ── Area Description ── */}
        <section className="max-w-4xl">
          <h2 className="text-3xl font-bold mb-6 font-heading">About {cityName}&apos;s Property Market</h2>
          <div className="space-y-4 text-neutral-600 dark:text-neutral-400 leading-relaxed">
            <p>
              {cityName} remains one of the most dynamic and sought-after property markets in the United Kingdom.
              With a rich tapestry of architectural styles spanning Georgian terraces, Victorian conversions, and
              cutting-edge new-build developments, the city offers something for every type of buyer and renter.
              The average property price currently sits at &pound;725,400, reflecting steady year-on-year growth
              driven by strong demand and limited housing supply in prime locations.
            </p>
            <p>
              For buyers, the outer boroughs present compelling value propositions. Areas such as Greenwich,
              Brixton, and Hackney have undergone significant regeneration in recent years, with new transport
              links &mdash; particularly the Elizabeth Line &mdash; opening up previously underserved
              neighbourhoods. First-time buyers are increasingly looking to Zone 3 and beyond, where average
              prices can be 40&ndash;60% lower than central {cityName} while still offering excellent connectivity
              and local amenities.
            </p>
            <p>
              The rental market in {cityName} continues to tighten, with demand outstripping supply by a
              significant margin. Average rents have risen by 12% year-on-year, particularly in areas popular
              with young professionals such as Clapham, Shoreditch, and Islington. Landlords are seeing strong
              yields, especially in purpose-built rental developments that offer amenities such as concierge
              services, gyms, and communal workspaces. For investors, {cityName} property remains a resilient
              long-term asset class with strong capital appreciation potential.
            </p>
          </div>
        </section>

        {/* ── Transport & Infrastructure ── */}
        <section className="grid lg:grid-cols-2 gap-12 bg-white dark:bg-neutral-900 p-8 lg:p-12 rounded-3xl shadow-sm border border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-3xl font-bold mb-8 font-heading">Transport &amp; Connectivity</h2>
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <Train className="size-6 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2">The Underground Network</h4>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                    With 11 lines spanning 272 stations, {cityName}&apos;s Tube is the lifeblood of the city.
                    Zone 1&ndash;2 commutes typically range from 15&ndash;30 minutes. Major stations include
                    King&apos;s Cross, Liverpool Street, Paddington, and Victoria.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <span className="w-4 h-4 rounded-full bg-red-600" title="Central Line" />
                    <span className="w-4 h-4 rounded-full bg-blue-800" title="Piccadilly Line" />
                    <span className="w-4 h-4 rounded-full bg-yellow-400" title="Circle Line" />
                    <span className="w-4 h-4 rounded-full bg-purple-500" title="Elizabeth Line" />
                    <span className="w-4 h-4 rounded-full bg-green-600" title="District Line" />
                    <span className="w-4 h-4 rounded-full bg-black" title="Northern Line" />
                  </div>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="size-6 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2">Education &amp; Catchments</h4>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                    Home to 40+ higher education institutions and some of the world&apos;s highest-ranked
                    primary schools. Areas like Barnet and Richmond are hotspots for school catchments.
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                  <Trees className="size-6 text-brand-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2">Green Spaces</h4>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                    {cityName} is 47% green space. From the royal parks of central {cityName} to the massive
                    expanse of Epping Forest and Richmond Park, there is no shortage of outdoor recreation.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden min-h-[400px]">
            <div className="w-full h-full bg-neutral-200" />
            <div className="absolute inset-0 bg-brand-primary/20 flex items-center justify-center">
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-2xl text-center max-w-xs">
                <Map className="size-10 text-brand-primary mx-auto mb-4" />
                <h4 className="font-bold mb-2">Interactive Transport Map</h4>
                <p className="text-sm text-neutral-500 mb-6">
                  Explore travel times from any location to major business hubs.
                </p>
                <Link
                  href={`/search?city=${citySlug}&view=map`}
                  className="block w-full py-3 bg-brand-primary text-white font-bold rounded-lg shadow-lg text-center"
                >
                  Open Connectivity Tool
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Find Local Services ── */}
        <section>
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2 font-heading">Find Local Services</h2>
              <p className="text-neutral-500">Trusted professionals in {cityName}, verified by Britestate</p>
            </div>
            <Link
              className="text-brand-primary font-semibold flex items-center gap-1 hover:gap-2 transition-all"
              href={`/services?area=${citySlug}`}
            >
              View all services <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {SERVICE_CATEGORIES.map((service) => (
              <Link
                key={service.title}
                href={`/services?area=${citySlug}&category=${service.title.toLowerCase().replace(/\s+/g, "-")}`}
                className="group flex flex-col gap-4 p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                  <service.icon className="size-6 text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{service.title}</h3>
                  <p className="text-neutral-500 text-sm">{service.description}</p>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs font-semibold text-brand-primary">{service.count} verified pros</span>
                  <ArrowRight className="size-4 text-brand-primary group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Newsletter CTA ── */}
        <section className="bg-brand-primary rounded-[2rem] p-8 md:p-16 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading">
              Stay ahead of the {cityName} market
            </h2>
            <p className="text-white/80 mb-10 text-lg">
              Get weekly insights on price changes, off-market opportunities, and investment analysis directly to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-grow px-6 py-4 rounded-xl bg-white text-neutral-400 text-left">
                Enter your email address
              </div>
              <Link
                href="/register"
                className="bg-white text-brand-primary px-8 py-4 rounded-xl font-bold hover:bg-neutral-100 transition-colors"
              >
                Join 50k+ Subscribers
              </Link>
            </div>
            <p className="mt-6 text-sm text-white/60">No spam. Only high-value property data. Unsubscribe anytime.</p>
          </div>
        </section>
      </main>
    </>
  );
}
