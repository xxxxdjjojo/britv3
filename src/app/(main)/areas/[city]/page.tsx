import type { Metadata } from "next";
import Link from "next/link";
import {
  TrendingUp,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Heart,
  Train,
  Zap,
  Wifi,
  GraduationCap,
  ShoppingBag,
  Trees,
  ArrowRight,
} from "lucide-react";
import { AreaPriceTrendClient } from "@/components/charts/AreaPriceTrendClient";

export const revalidate = 86400;

export async function generateStaticParams() {
  return [
    { city: "london" },
    { city: "manchester" },
    { city: "birmingham" },
    { city: "bristol" },
    { city: "leeds" },
    { city: "edinburgh" },
    { city: "oxford" },
    { city: "cambridge" },
  ];
}

type CityPageProps = Readonly<{ params: Promise<{ city: string }> }>;

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { city } = await params;
  const cityName = city.charAt(0).toUpperCase() + city.slice(1);
  return {
    title: `Properties in ${cityName} | Britestate Area Guide`,
    description: `Explore ${cityName} property market data, prices, schools and transport.`,
    alternates: { canonical: `/areas/${city}` },
  };
}

const CITY_DATA: Record<string, { avgPrice: string; yoy: string; listings: string; daysToSell: string; description: string }> = {
  london: { avgPrice: "£725,480", yoy: "+4.2%", listings: "12,400", daysToSell: "34", description: "The world's most dynamic property market, spanning 33 boroughs." },
  manchester: { avgPrice: "£298,500", yoy: "+6.1%", listings: "4,200", daysToSell: "28", description: "The UK's fastest-growing major city, with booming regeneration zones." },
  birmingham: { avgPrice: "£265,000", yoy: "+5.3%", listings: "5,800", daysToSell: "31", description: "The UK's second city, transformed by the Commonwealth Games legacy." },
  bristol: { avgPrice: "£385,000", yoy: "+3.8%", listings: "2,900", daysToSell: "26", description: "A vibrant, creative city with strong demand and limited supply." },
  leeds: { avgPrice: "£249,000", yoy: "+7.2%", listings: "3,600", daysToSell: "24", description: "Yorkshire's commercial hub with excellent graduate retention." },
  edinburgh: { avgPrice: "£340,000", yoy: "+4.9%", listings: "2,100", daysToSell: "22", description: "Scotland's capital with a world-class old town and strong tourism economy." },
  oxford: { avgPrice: "£512,000", yoy: "+2.7%", listings: "1,400", daysToSell: "38", description: "One of the UK's most coveted addresses, driven by the university and science parks." },
  cambridge: { avgPrice: "£495,000", yoy: "+3.1%", listings: "1,600", daysToSell: "35", description: "Silicon Fen's knowledge economy drives sustained property demand." },
};

const BOROUGHS = [
  { name: "Westminster", avgPrice: "£1.2M", slug: "westminster" },
  { name: "Camden", avgPrice: "£850k", slug: "camden" },
  { name: "Islington", avgPrice: "£780k", slug: "islington" },
  { name: "Isleworth", avgPrice: "£542k", slug: "isleworth" },
];

const SALE_PROPERTIES = [
  { price: "1,450,000", address: "Elizabeth St, Belgravia, SW1W", beds: 3, baths: 2, sqft: "1,240", badge: "Premium" },
  { price: "875,000", address: "Tufnell Park Road, Islington, N7", beds: 2, baths: 1, sqft: "980", badge: null },
  { price: "620,000", address: "Harbour Way, Canary Wharf, E14", beds: 1, baths: 1, sqft: "640", badge: "New Build" },
];

const LOCAL_SERVICES = [
  { icon: ShoppingBag, label: "Shops & Retail" },
  { icon: GraduationCap, label: "Schools" },
  { icon: Train, label: "Transport" },
  { icon: Trees, label: "Green Spaces" },
  { icon: Wifi, label: "Connectivity" },
  { icon: Zap, label: "Utilities" },
];

export default async function CityAreaGuidePage({ params }: CityPageProps) {
  const { city } = await params;
  const cityName = city.charAt(0).toUpperCase() + city.slice(1);
  const data = CITY_DATA[city.toLowerCase()] ?? CITY_DATA.london;

  return (
    <>
      {/* ── Hero (70vh) ── */}
      <header className="relative min-h-[70vh] flex flex-col justify-end overflow-hidden">
        {/* Background image placeholder */}
        <div className="absolute inset-0 bg-neutral-800" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-6 text-sm text-white/80" aria-label="Breadcrumb">
            <Link href="/areas" className="hover:text-white">Guides</Link>
            <span>/</span>
            <Link href="/areas" className="hover:text-white">United Kingdom</Link>
            <span>/</span>
            <span className="text-white font-medium">{cityName}</span>
          </nav>

          <h1 className="font-heading text-[60px] leading-none font-bold text-white mb-4 max-md:text-[40px]">
            {cityName}
          </h1>
          <p className="text-lg text-white/90 mb-10 max-w-xl">{data.description}</p>

          {/* Floating search bar */}
          <div className="bg-white rounded-2xl shadow-xl px-6 py-4 flex items-center gap-4 max-w-2xl">
            <MapPin className="size-5 text-neutral-400 flex-shrink-0" />
            <input
              type="text"
              placeholder={`Search areas in ${cityName}...`}
              className="flex-1 text-neutral-700 outline-none text-sm"
              readOnly
            />
            <Link
              href={`/search?city=${city}`}
              className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors flex-shrink-0"
            >
              Search
            </Link>
          </div>
        </div>
      </header>

      {/* ── Stats Bar (3 cards) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: "Avg Property Price", value: data.avgPrice, sub: data.yoy, subIcon: true },
            { label: "Active Listings", value: data.listings, sub: "Properties available now", subIcon: false },
            { label: "Avg Days to Sell", value: `${data.daysToSell} days`, sub: "Faster than UK avg", subIcon: false },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-primary/10 p-6">
              <p className="text-sm text-neutral-500 mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-primary font-heading">{stat.value}</p>
              {stat.subIcon ? (
                <p className="text-emerald-600 font-bold flex items-center gap-1 mt-1 text-sm">
                  <TrendingUp className="size-4" /> {stat.sub} YoY
                </p>
              ) : (
                <p className="text-sm text-neutral-400 mt-1">{stat.sub}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 pb-24">

        {/* ── 5-Year Price Trend ── */}
        <section>
          <div className="bg-white rounded-xl shadow-sm border border-primary/10 p-8">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold font-heading text-neutral-900">5-Year Price Trend</h2>
                <p className="text-sm text-neutral-500 mt-1">Average property prices in {cityName}</p>
              </div>
              {/* Property type toggle pills */}
              <div className="flex gap-2">
                {["All", "Flat", "Terraced"].map((type, i) => (
                  <span
                    key={type}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold cursor-pointer ${
                      i === 0
                        ? "bg-primary/10 text-primary"
                        : "text-neutral-400 hover:text-primary"
                    }`}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
            <AreaPriceTrendClient />
          </div>
        </section>

        {/* ── Popular Boroughs (4-col grid) ── */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-3xl font-bold font-heading">Popular Boroughs</h2>
            <Link
              href={`/areas/${city}/all`}
              className="text-primary font-bold flex items-center gap-1 hover:gap-2 transition-all text-sm"
            >
              View all boroughs <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {BOROUGHS.map((borough) => (
              <Link
                key={borough.name}
                href={`/areas/${city}/${borough.slug}`}
                className="group border border-primary/10 bg-white rounded-xl p-4 hover:shadow-md transition-all"
              >
                {/* Image placeholder */}
                <div className="h-24 w-full rounded-lg overflow-hidden bg-neutral-200 mb-3 group-hover:scale-[1.02] transition-transform duration-300" />
                <p className="font-bold text-neutral-900">{borough.name}</p>
                <p className="text-sm text-neutral-500">Avg {borough.avgPrice}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Properties For Sale (3-col grid) ── */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold font-heading">Properties For Sale</h2>
            <button className="border border-primary/20 text-primary px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/5 transition-colors">
              Filter
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SALE_PROPERTIES.map((property) => (
              <div
                key={property.address}
                className="overflow-hidden rounded-xl border border-primary/10 bg-white shadow-sm hover:shadow-lg transition-all"
              >
                {/* Image 16:10 */}
                <div className="relative" style={{ paddingTop: "62.5%" }}>
                  <div className="absolute inset-0 bg-neutral-200" />
                  {property.badge && (
                    <span className="absolute top-3 right-3 bg-white/90 text-primary text-xs font-bold px-3 py-1 rounded-full">
                      {property.badge}
                    </span>
                  )}
                  <button
                    className="absolute top-3 left-3 p-2 rounded-full bg-white/20 backdrop-blur-sm"
                    aria-label="Save property"
                  >
                    <Heart className="size-4 text-primary/40 hover:text-rose-500" />
                  </button>
                </div>
                <div className="p-5">
                  <p className="text-lg font-bold text-neutral-900">£{property.price}</p>
                  <p className="text-sm text-neutral-500 mb-3">{property.address}</p>
                  <div className="flex items-center gap-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-1"><Bed className="size-3.5" /> {property.beds} bed</span>
                    <span className="flex items-center gap-1"><Bath className="size-3.5" /> {property.baths} bath</span>
                    <span className="flex items-center gap-1"><Maximize2 className="size-3.5" /> {property.sqft} sqft</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-10">
            <Link
              href={`/search?city=${city}&type=buy`}
              className="bg-primary text-white rounded-full px-8 py-3 font-bold hover:scale-105 transition-transform"
            >
              View all properties
            </Link>
          </div>
        </section>

        {/* ── Transport & Connectivity ── */}
        <section className="bg-primary text-white p-8 lg:p-12 rounded-xl">
          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <h2 className="text-2xl font-bold font-heading mb-4">Transport &amp; Connectivity</h2>
              <p className="text-white/80 mb-8 leading-relaxed">
                {cityName}&apos;s transport network provides outstanding connectivity across the region,
                with multiple options for commuters and travellers.
              </p>
              <div className="space-y-3">
                {[
                  { route: "City Centre", time: "15 min", pct: 85 },
                  { route: "Airport", time: "25 min", pct: 60 },
                  { route: "Financial District", time: "10 min", pct: 95 },
                ].map((item) => (
                  <div key={item.route}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/80">{item.route}</span>
                      <span className="font-bold">{item.time}</span>
                    </div>
                    <div className="bg-white/10 rounded-full h-1">
                      <div
                        className="bg-white/60 h-1 rounded-full"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 content-start">
              {[
                { icon: Train, label: "Underground", detail: "11 lines" },
                { icon: Train, label: "Elizabeth Line", detail: "Zone 1–6" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white/10 border border-white/10 rounded-lg p-4"
                >
                  <item.icon className="size-5 mb-2 text-white/70" />
                  <p className="font-bold text-sm">{item.label}</p>
                  <p className="text-xs text-white/60">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Local Services (6-icon grid) ── */}
        <section>
          <h2 className="text-3xl font-bold font-heading mb-8">Local Services</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {LOCAL_SERVICES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="group bg-white rounded-xl p-6 shadow-sm border border-primary/10 hover:border-primary transition-all text-center"
              >
                <div className="h-12 w-12 rounded-full bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors flex items-center justify-center mx-auto mb-3">
                  <Icon className="size-5" />
                </div>
                <p className="text-sm font-bold text-neutral-800">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Newsletter CTA ── */}
        <section className="rounded-3xl bg-primary text-white p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
              Stay ahead of the {cityName} market
            </h2>
            <p className="text-white/80 mb-8">
              Weekly price alerts, off-market opportunities and investment insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 outline-none"
              />
              <button className="bg-white text-primary font-bold px-8 py-4 rounded-xl hover:bg-neutral-100 transition-colors">
                Join the Waitlist
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
