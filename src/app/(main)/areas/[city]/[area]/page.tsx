import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  ArrowRight,
  TrendingUp,
  Train,
  Car,
  TrainFront,
  Trees,
  UtensilsCrossed,
  Star,
  StarHalf,
  MapPin,
  GraduationCap,
  Info,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/* ── Types ── */

type AreaPageProps = Readonly<{
  params: Promise<{ city: string; area: string }>;
}>;

/* ── Mock Data ── */

const AREA_DATA = {
  name: "Isleworth",
  postcode: "TW7",
  borough: "Hounslow",
  city: "London",
  heroDescription:
    "A charming riverside suburb blending historic character with modern connectivity. From the picturesque Old Isleworth to the well-connected Spring Grove.",
  avgPrice: "\u00A3542,000",
  avgRent: "\u00A31,950pcm",
  councilTax: "Band D",
  rentalYield: "4.2%",
  listings: 342,
  mostCommonType: "Terraced",
  priceGrowth: "+14.2%",
  priceTrends: [
    { year: "2020", height: "h-1/2", opacity: "bg-brand-primary/40" },
    { year: "2021", height: "h-[60%]", opacity: "bg-brand-primary/50" },
    { year: "2022", height: "h-[55%]", opacity: "bg-brand-primary/60" },
    { year: "2023", height: "h-[75%]", opacity: "bg-brand-primary/80" },
    { year: "2024", height: "h-[90%]", opacity: "bg-brand-primary" },
  ],
  propertyMix: [
    { type: "Terraced", pct: 35 },
    { type: "Semi-Detached", pct: 28 },
    { type: "Flat", pct: 22 },
    { type: "Detached", pct: 15 },
  ],
  demographics: {
    population: "36,000",
    medianAge: 37,
    households: "14,200",
    ownerOccupied: "58%",
    privateRented: "28%",
    socialRented: "14%",
  },
  schools: [
    { name: "The Blue School (CE)", type: "Primary", ofsted: "Outstanding", distance: "0.3 miles" },
    { name: "Isleworth & Syon School", type: "Secondary", ofsted: "Good", distance: "0.6 miles" },
    { name: "Marlborough Primary", type: "Primary", ofsted: "Outstanding", distance: "0.8 miles" },
    { name: "Gumley House Convent", type: "Secondary", ofsted: "Outstanding", distance: "1.1 miles" },
    { name: "Worple Primary", type: "Primary", ofsted: "Good", distance: "0.5 miles" },
  ],
  transport: [
    { name: "London Waterloo", detail: "37 mins via SWR", icon: "train" as const },
    { name: "Heathrow Airport", detail: "15 mins drive (M4)", icon: "car" as const },
    { name: "Osterley (Piccadilly)", detail: "1.2 miles away", icon: "tube" as const },
    { name: "Hounslow East (Piccadilly)", detail: "1.5 miles away", icon: "tube" as const },
  ],
  amenities: {
    restaurants: 45,
    shops: 28,
    parks: 8,
  },
  crime: {
    badge: "Below borough average",
    rate: "12.3 per 1,000 residents",
    comparison: "Hounslow average: 15.8 per 1,000",
  },
  broadband: {
    avgSpeed: "67 Mbps",
    fibreAvailable: true,
  },
  properties: [
    { id: 1, title: "3-Bed Victorian Terrace", address: "14 South Street, Isleworth, TW7 7BG", price: "\u00A3485,000", beds: 3, baths: 2 },
    { id: 2, title: "2-Bed Modern Flat", address: "Nazareth House, Isleworth, TW7 5NR", price: "\u00A3375,000", beds: 2, baths: 1 },
    { id: 3, title: "4-Bed Semi-Detached", address: "Twickenham Road, Isleworth, TW7 6DB", price: "\u00A3650,000", beds: 4, baths: 2 },
    { id: 4, title: "1-Bed Apartment", address: "Worton Road, Isleworth, TW7 6ER", price: "\u00A3350,000", beds: 1, baths: 1 },
    { id: 5, title: "3-Bed End of Terrace", address: "Linkfield Road, Isleworth, TW7 6QE", price: "\u00A3520,000", beds: 3, baths: 1 },
    { id: 6, title: "5-Bed Detached House", address: "Spring Grove Road, Isleworth, TW7 4AA", price: "\u00A3625,000", beds: 5, baths: 3 },
  ],
  experts: [
    { name: "Marcus Thompson", role: "Senior Sales Manager", reviews: 48, rating: 5 },
    { name: "Sarah Chen", role: "Lettings Specialist", reviews: 92, rating: 4.5 },
    { name: "David Wright", role: "Mortgage Advisor", reviews: 156, rating: 5 },
  ],
  editorial: [
    "Isleworth is one of West London\u2019s best-kept secrets, a riverside suburb that combines the charm of a historic village with the convenience of excellent transport links. Situated within the London Borough of Hounslow, it straddles the banks of the Thames near its confluence with the Duke of Northumberland\u2019s River, offering waterside walks and a genuinely peaceful atmosphere just 10 miles from central London.",
    "The area is broadly divided into two distinct characters: Old Isleworth, centred around the picturesque All Saints Church and Town Wharf, retains an almost rural feel with its 18th-century architecture and independent pubs. Further east, Spring Grove offers wide, tree-lined avenues of Victorian and Edwardian houses popular with families drawn by the proximity to outstanding schools and Osterley Park.",
    "For commuters, Isleworth station provides regular South Western Railway services to Waterloo in around 37 minutes, while the Piccadilly Line is accessible from both Osterley and Hounslow East. The M4 corridor places Heathrow Airport within a 15-minute drive. With average house prices still below the wider London average, Isleworth represents compelling value for buyers seeking space, greenery, and community spirit without sacrificing connectivity.",
  ],
};

const TRANSPORT_ICONS = {
  train: Train,
  car: Car,
  tube: TrainFront,
} as const;

/* ── SEO ── */

export async function generateMetadata({ params }: AreaPageProps): Promise<Metadata> {
  const { city, area } = await params;
  const areaName = area.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const cityName = city.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `Properties in ${areaName}, ${AREA_DATA.postcode} | ${cityName} Area Guide | Britestate`,
    description: `Explore ${areaName} \u2014 property prices, schools, transport, demographics, and local insights. ${AREA_DATA.listings} homes for sale in ${AREA_DATA.postcode}.`,
  };
}

/* ── Helpers ── */

function ofstedBadge(rating: string) {
  if (rating === "Outstanding") {
    return (
      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
        {rating}
      </span>
    );
  }
  return (
    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
      {rating}
    </span>
  );
}

function StarRating({ rating, reviews }: Readonly<{ rating: number; reviews: number }>) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 !== 0;
  return (
    <div className="flex items-center gap-1 text-amber-500">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={i} className="size-4 fill-current" />
      ))}
      {hasHalf && <StarHalf className="size-4 fill-current" />}
      <span className="text-xs text-neutral-400 font-medium ml-1">({reviews})</span>
    </div>
  );
}

/* ── Page ── */

export default async function AreaPage({ params }: AreaPageProps) {
  const { city, area } = await params;
  const areaName = area.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const cityName = city.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative h-[500px] overflow-hidden bg-neutral-800">
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 h-full flex flex-col justify-center text-white">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm mb-6 opacity-80" aria-label="Breadcrumb">
            <Link href="/areas" className="hover:underline">
              Areas
            </Link>
            <ChevronRight className="size-3" />
            <Link href={`/areas/${city}`} className="hover:underline">
              {cityName}
            </Link>
            <ChevronRight className="size-3" />
            <span>{areaName}</span>
          </nav>

          <h1 className="text-5xl font-bold mb-4 font-heading">
            Properties in {areaName}, {AREA_DATA.postcode}
          </h1>
          <p className="text-xl max-w-2xl text-neutral-200 mb-8 leading-relaxed">
            {AREA_DATA.heroDescription}
          </p>
          <div className="flex gap-4">
            <Link
              href={`/search?area=${area}`}
              className="bg-brand-primary hover:bg-brand-primary-light text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all"
            >
              View Listings <ArrowRight className="size-5" />
            </Link>
            <Link
              href="/valuation"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-xl font-bold border border-white/20 transition-all"
            >
              Free Valuation
            </Link>
          </div>
        </div>
      </section>

      {/* ── Sub-navigation ── */}
      <div className="sticky top-20 z-40 bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
          <div className="flex gap-8 py-4 whitespace-nowrap text-sm font-semibold">
            <a href="#market-data" className="text-brand-primary border-b-2 border-brand-primary pb-4 -mb-[17px]">
              Market Insights
            </a>
            <a href="#connectivity" className="hover:text-brand-primary transition-colors">
              Transport
            </a>
            <a href="#schools" className="hover:text-brand-primary transition-colors">
              Schools
            </a>
            <a href="#lifestyle" className="hover:text-brand-primary transition-colors">
              Lifestyle &amp; Parks
            </a>
            <a href="#local-experts" className="hover:text-brand-primary transition-colors">
              Local Experts
            </a>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        {/* ── Market Intelligence ── */}
        <section id="market-data">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 font-heading">Market Intelligence</h2>
            <p className="text-neutral-500">Comprehensive real estate data for {AREA_DATA.postcode} postcode</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Price Trends Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <CardTitle className="font-bold text-lg">Price Growth Trends</CardTitle>
                    <p className="text-xs text-neutral-400">Past 5 Years &middot; Land Registry Data</p>
                  </div>
                  <div className="text-right">
                    <span className="text-green-500 font-bold flex items-center justify-end gap-1">
                      <TrendingUp className="size-4" /> {AREA_DATA.priceGrowth}
                    </span>
                    <p className="text-xs text-neutral-400">Average Growth</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-2 px-4 relative">
                  {/* Grid lines */}
                  <div className="absolute inset-x-0 top-0 h-px bg-neutral-100" />
                  <div className="absolute inset-x-0 top-1/4 h-px bg-neutral-100" />
                  <div className="absolute inset-x-0 top-2/4 h-px bg-neutral-100" />
                  <div className="absolute inset-x-0 top-3/4 h-px bg-neutral-100" />

                  {AREA_DATA.priceTrends.map((bar) => (
                    <div key={bar.year} className={`w-full rounded-t ${bar.height} relative`}>
                      <div className={`absolute inset-0 ${bar.opacity} rounded-t`} />
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-neutral-400">
                        {bar.year}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sidebar: Property Mix + Market Snapshot */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-bold text-lg">Property Mix</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {AREA_DATA.propertyMix.map((item) => (
                    <div key={item.type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.type}</span>
                        <span className="font-semibold">{item.pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-neutral-100 rounded-full">
                        <div
                          className="h-full bg-brand-primary rounded-full"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="bg-brand-primary text-white p-6 rounded-xl shadow-lg">
                <h3 className="font-bold text-lg mb-4 font-heading">Market Snapshot</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs opacity-80">Avg. House Price</p>
                    <p className="text-xl font-bold">{AREA_DATA.avgPrice}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-80">Avg. Rent (2br)</p>
                    <p className="text-xl font-bold">{AREA_DATA.avgRent}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-80">Council Tax</p>
                    <p className="text-xl font-bold">{AREA_DATA.councilTax}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-80">Rental Yield</p>
                    <p className="text-xl font-bold">{AREA_DATA.rentalYield}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Connectivity & Map ── */}
        <section id="connectivity" className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-4 font-heading">Connectivity</h2>
              <p className="text-neutral-600 mb-6 leading-relaxed">
                Isleworth is a commuter&apos;s dream, offering rapid access to the heart of London and Heathrow Airport.
              </p>
            </div>

            <div className="space-y-4">
              {AREA_DATA.transport.map((item) => {
                const Icon = TRANSPORT_ICONS[item.icon];
                return (
                  <div
                    key={item.name}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-neutral-200"
                  >
                    <div className="w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-lg flex items-center justify-center">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h4 className="font-bold">{item.name}</h4>
                      <p className="text-sm text-neutral-500">{item.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Map placeholder */}
          <div className="lg:col-span-2 relative h-[500px] bg-neutral-200 rounded-2xl overflow-hidden border-4 border-white shadow-xl flex items-center justify-center">
            <div className="text-center">
              <MapPin className="size-12 text-neutral-400 mx-auto mb-3" />
              <p className="text-neutral-500 font-semibold text-lg">Interactive map &mdash; coming soon</p>
            </div>
          </div>
        </section>

        {/* ── Schools ── */}
        <section id="schools">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2 font-heading">Top Local Schools</h2>
              <p className="text-neutral-500">Education performance for catchment areas</p>
            </div>
            <Link
              href={`/search?area=${area}&type=schools`}
              className="text-brand-primary font-bold flex items-center gap-1 hover:underline"
            >
              View School Map <GraduationCap className="size-4" />
            </Link>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500 font-bold border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-4">School Name</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Ofsted Rating</th>
                    <th className="px-6 py-4">Distance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {AREA_DATA.schools.map((school) => (
                    <tr key={school.name} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 font-semibold">{school.name}</td>
                      <td className="px-6 py-4 text-sm">{school.type}</td>
                      <td className="px-6 py-4">{ofstedBadge(school.ofsted)}</td>
                      <td className="px-6 py-4 text-sm text-neutral-500">{school.distance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <p className="mt-4 text-xs text-neutral-400 flex items-center gap-1">
            <Info className="size-3" /> Data source: Department for Education (DfE) 2024
          </p>
        </section>

        {/* ── Demographics ── */}
        <section>
          <h2 className="text-3xl font-bold mb-6 font-heading">Demographics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-brand-primary font-heading">{AREA_DATA.demographics.population}</p>
                <p className="text-sm text-neutral-500 mt-1">Population</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-brand-primary font-heading">{AREA_DATA.demographics.medianAge}</p>
                <p className="text-sm text-neutral-500 mt-1">Median Age</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-brand-primary font-heading">{AREA_DATA.demographics.households}</p>
                <p className="text-sm text-neutral-500 mt-1">Households</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Owner Occupied", value: AREA_DATA.demographics.ownerOccupied },
              { label: "Private Rented", value: AREA_DATA.demographics.privateRented },
              { label: "Social Rented", value: AREA_DATA.demographics.socialRented },
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="pt-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span>{item.label}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 rounded-full">
                    <div
                      className="h-full bg-brand-primary rounded-full"
                      style={{ width: item.value }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Amenities, Crime & Broadband ── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bold text-lg">Amenities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <UtensilsCrossed className="size-5 text-brand-primary" />
                <span className="text-sm">{AREA_DATA.amenities.restaurants} restaurants</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="size-5 text-brand-primary" />
                <span className="text-sm">{AREA_DATA.amenities.shops} shops</span>
              </div>
              <div className="flex items-center gap-3">
                <Trees className="size-5 text-brand-primary" />
                <span className="text-sm">{AREA_DATA.amenities.parks} parks</span>
              </div>
            </CardContent>
          </Card>

          {/* Crime */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bold text-lg">Crime Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                {AREA_DATA.crime.badge}
              </span>
              <p className="text-sm text-neutral-600">{AREA_DATA.crime.rate}</p>
              <p className="text-xs text-neutral-400">{AREA_DATA.crime.comparison}</p>
            </CardContent>
          </Card>

          {/* Broadband */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bold text-lg">Broadband</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-2xl font-bold text-brand-primary font-heading">{AREA_DATA.broadband.avgSpeed}</p>
              <p className="text-sm text-neutral-500">Average download speed</p>
              {AREA_DATA.broadband.fibreAvailable && (
                <span className="inline-block px-3 py-1 bg-brand-primary-lighter text-brand-primary rounded-full text-xs font-bold">
                  Fibre Available
                </span>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ── Properties ── */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2 font-heading">Properties in {areaName}</h2>
              <p className="text-neutral-500">{AREA_DATA.listings} listings available in {AREA_DATA.postcode}</p>
            </div>
            <Link
              href={`/search?area=${area}`}
              className="text-brand-primary font-bold flex items-center gap-1 hover:underline"
            >
              View all <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {AREA_DATA.properties.map((property) => (
              <Card key={property.id} className="hover:shadow-lg transition-shadow">
                {/* Image placeholder */}
                <div className="h-48 bg-neutral-200 rounded-t-xl flex items-center justify-center">
                  <MapPin className="size-8 text-neutral-400" />
                </div>
                <CardContent className="pt-4">
                  <p className="text-xl font-bold text-brand-primary font-heading">{property.price}</p>
                  <h3 className="font-semibold mt-1">{property.title}</h3>
                  <p className="text-sm text-neutral-500 mt-1">{property.address}</p>
                  <div className="flex gap-4 mt-3 text-sm text-neutral-600">
                    <span>{property.beds} bed{property.beds !== 1 ? "s" : ""}</span>
                    <span>{property.baths} bath{property.baths !== 1 ? "s" : ""}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Lifestyle Spotlight ── */}
        <section id="lifestyle" className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl bg-neutral-200 flex items-center justify-center">
            <div className="text-center">
              <Trees className="size-12 text-neutral-400 mx-auto mb-3" />
              <p className="text-neutral-500 font-semibold">Osterley Park &amp; House</p>
              <p className="text-sm text-neutral-400">A National Trust treasure within walking distance.</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl font-bold font-heading">Life in {areaName}</h2>
            <p className="text-neutral-600 leading-relaxed">
              Known for its community spirit, Isleworth offers a slower pace of life without sacrificing the benefits of London living. Residents enjoy the proximity to the River Thames, with the &ldquo;Town Wharf&rdquo; being a popular spot for weekend strolls and local pub visits.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-neutral-50 rounded-lg">
                <Trees className="size-5 text-brand-primary mb-2" />
                <h5 className="font-bold text-sm">Green Spaces</h5>
                <p className="text-xs text-neutral-500">15+ local parks and gardens</p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg">
                <UtensilsCrossed className="size-5 text-brand-primary mb-2" />
                <h5 className="font-bold text-sm">Dining Hubs</h5>
                <p className="text-xs text-neutral-500">Independent bistros and pubs</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Local Experts ── */}
        <section id="local-experts">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 font-heading">Local {areaName} Experts</h2>
            <p className="text-neutral-600">The most trusted professionals operating in {AREA_DATA.postcode}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {AREA_DATA.experts.map((expert) => (
              <Card key={expert.name} className="flex flex-col items-center text-center p-6">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full bg-neutral-200 flex items-center justify-center">
                    <span className="text-2xl font-bold text-neutral-400">
                      {expert.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white" />
                </div>
                <h4 className="font-bold text-lg">{expert.name}</h4>
                <p className="text-xs text-brand-primary font-bold uppercase tracking-wider mb-2">{expert.role}</p>
                <div className="mb-4">
                  <StarRating rating={expert.rating} reviews={expert.reviews} />
                </div>
                <Link
                  href={`/services?area=${area}`}
                  className="w-full py-2 bg-neutral-100 hover:bg-brand-primary hover:text-white rounded-lg text-sm font-bold transition-all text-center block"
                >
                  Contact Expert
                </Link>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Editorial Description ── */}
        <section>
          <h2 className="text-3xl font-bold mb-6 font-heading">About {areaName}</h2>
          <div className="prose prose-neutral max-w-none space-y-4">
            {AREA_DATA.editorial.map((paragraph, i) => (
              <p key={i} className="text-neutral-600 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
