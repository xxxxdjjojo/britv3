import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Trees,
  Coffee,
  GraduationCap,
  Phone,
  Calendar,
  Share2,
  Wifi,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PrintButton } from "@/components/area/PrintButton";
import { MapEmbedClient } from "@/components/maps/MapEmbedClient";
import { AreaPriceTrendClient } from "@/components/charts/AreaPriceTrendClient";
import { PropertyDonutClient } from "@/components/charts/PropertyDonutClient";
import { ListingVolumeClient } from "@/components/charts/ListingVolumeClient";
import { getNeighbourhoodData, getAllCitySlugs } from "@/services/areas/area-data-service";
import { getNeighbourhoodsForCity } from "@/services/areas/mock-data/neighbourhoods";
import { neighbourhoodPlaceJsonLd } from "@/lib/seo/area-jsonld";
import { buildBreadcrumbJsonLd } from "@/lib/seo/breadcrumb-jsonld";
import { AreaSearchCTA } from "@/components/areas/AreaSearchCTA";
import { DataAttribution } from "@/components/areas/DataAttribution";
import { InternalLinkCard } from "@/components/areas/InternalLinkCard";

export const revalidate = 86400;

type AreaPageProps = Readonly<{ params: Promise<{ city: string; area: string }> }>;

export async function generateStaticParams() {
  const { getAllCitySlugs: getCitySlugs } = await import("@/services/areas/area-data-service");
  const { getNeighbourhoodsForCity: getNeighbourhoods } = await import("@/services/areas/mock-data/neighbourhoods");
  const params: Array<{ city: string; area: string }> = [];
  for (const city of getCitySlugs()) {
    for (const n of getNeighbourhoods(city)) {
      params.push({ city, area: n.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: AreaPageProps): Promise<Metadata> {
  const { city, area: areaSlug } = await params;
  const area = await getNeighbourhoodData(city, areaSlug);
  if (!area) {
    return { title: "Area Not Found | Britestate" };
  }
  return {
    title: `${area.name}, ${area.cityName} Property Guide — Average Prices & Local Info | Britestate`,
    description: `Discover ${area.name}: property prices, schools, transport and lifestyle in ${area.cityName}.`,
    alternates: { canonical: `/areas/${area.citySlug}/${area.slug}` },
    openGraph: {
      title: `${area.name}, ${area.cityName} Property Guide | Britestate`,
      description: area.description,
      url: `/areas/${area.citySlug}/${area.slug}`,
      type: "website",
    },
  };
}

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  park: Trees,
  cafe: Coffee,
  pub: Coffee,
  attraction: GraduationCap,
};

function OfstedBadge({ rating }: Readonly<{ rating: "Outstanding" | "Good" | "Requires Improvement" | "Inadequate" }>) {
  const classes: Record<string, string> = {
    Outstanding: "bg-brand-primary-lighter text-brand-primary",
    Good: "bg-[--color-info-light] text-[--color-info]",
    "Requires Improvement": "bg-brand-secondary-light text-[--color-brand-secondary-dark]",
    Inadequate: "bg-[--color-error-light] text-[--color-error]",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${classes[rating]}`}>
      {rating}
    </span>
  );
}

export default async function AreaPage({ params }: AreaPageProps) {
  const { city, area: areaSlug } = await params;
  const area = await getNeighbourhoodData(city, areaSlug);
  if (!area) notFound();

  const MOCK_LISTINGS = [
    { price: area.avgPriceFormatted, address: `1 High Street, ${area.postcode}`, beds: 3, baths: 2, status: "For Sale", sqft: "1,100" },
    { price: area.avgPriceFormatted, address: `22 Church Road, ${area.postcode}`, beds: 2, baths: 1, status: "Reduced", sqft: "750" },
    { price: area.avgPriceFormatted, address: `7 Station Lane, ${area.postcode}`, beds: 4, baths: 2, status: "New", sqft: "1,450" },
    { price: area.avgPriceFormatted, address: `14 Mill Street, ${area.postcode}`, beds: 1, baths: 1, status: "For Sale", sqft: "560" },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(neighbourhoodPlaceJsonLd(area)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Areas", path: "/areas" },
              { name: area.cityName, path: `/areas/${area.citySlug}` },
              { name: area.name, path: `/areas/${area.citySlug}/${area.slug}` },
            ])
          ),
        }}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Breadcrumb ── */}
        <nav className="text-sm text-[#404945] mb-8 flex items-center gap-2" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
          <span className="text-[#e3e2e1]">/</span>
          <Link href="/areas" className="hover:text-brand-primary transition-colors">Area Guides</Link>
          <span className="text-[#e3e2e1]">/</span>
          <Link href={`/areas/${area.citySlug}`} className="hover:text-brand-primary transition-colors">{area.cityName}</Link>
          <span className="text-[#e3e2e1]">/</span>
          <span className="text-[#1a1c1c] font-medium">{area.name}</span>
        </nav>

        {/* ── Split Hero ── */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16 items-start">
          {/* Left: Text */}
          <div>
            <span className="inline-block bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
              {area.borough}
            </span>
            <h1 className="font-heading font-bold text-[#1a1c1c] mb-4 max-lg:text-[36px]" style={{ fontSize: "clamp(36px,4vw,56px)", lineHeight: 1.1 }}>
              Life in {area.postcode} —<br />{area.name}
            </h1>
            <p className="text-lg text-[#404945] leading-relaxed mb-8 max-w-lg">
              {area.description}
            </p>
            {/* 3 mini stat cards */}
            <div className="flex flex-wrap gap-4">
              {[
                { value: area.greenSpace, label: "Green Space" },
                { value: area.walkability, label: "Walkability" },
                { value: area.noiseLevel, label: "Noise Level" },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#faf9f8] rounded-xl p-4 min-w-[140px]">
                  <p className="text-brand-primary font-bold text-2xl">{stat.value}</p>
                  <p className="text-[#404945] text-xs font-medium uppercase tracking-tight mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Map */}
          <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-lg">
            <MapEmbedClient
              latitude={area.coordinates.lat}
              longitude={area.coordinates.lng}
              zoom={13}
              className="w-full h-full"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-surface-container-lowest/90 backdrop-blur-md p-3 flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm font-medium text-[#1a1c1c]">
                <MapPin className="size-4 text-brand-primary" />
                {area.postcode} Boundary Overview
              </div>
              <button className="bg-brand-primary text-white px-4 py-1.5 rounded-xl text-xs font-semibold hover:bg-brand-primary/90 transition-colors">
                Interactive Map
              </button>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="overview">
          <TabsList variant="line" className="w-full border-b border-[--color-outline-variant] mb-10 rounded-none h-auto pb-0">
            {["overview", "market", "transport", "schools", "lifestyle"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="capitalize text-sm font-semibold pb-4 px-6 rounded-none"
              >
                {tab === "market" ? "Market Data" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Tab 1: Overview ── */}
          <TabsContent value="overview">
            <div className="space-y-12">
              {/* Local Favourites */}
              <section>
                <h2 className="text-2xl font-bold font-heading mb-6">Local Favourites</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {area.localFavourites.map(({ label, desc, category }) => {
                    const Icon = CATEGORY_ICON_MAP[category] ?? Trees;
                    const colorMap: Record<string, string> = { park: "text-[--color-brand-primary-light]", cafe: "text-[--color-brand-secondary-dark]", pub: "text-[--color-brand-secondary-dark]", attraction: "text-[--color-info]" };
                    const color = colorMap[category] ?? "text-brand-primary";
                    return (
                      <div key={label} className="bg-[#faf9f8] rounded-xl p-4 hover:bg-[#f4f3f2] transition-colors">
                        <Icon className={`size-6 ${color} mb-3`} />
                        <p className="font-semibold text-[#1a1c1c]">{label}</p>
                        <p className="text-sm text-[#404945]">{desc}</p>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Demographic Snapshot */}
              <section className="bg-brand-primary/5 rounded-2xl p-8">
                <h2 className="text-2xl font-bold font-heading mb-6 text-[#1a1c1c]">Demographic Snapshot</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: "Top Group", value: area.demographics.topGroup },
                    { label: "Median Age", value: String(area.demographics.medianAge) },
                    { label: "Ownership", value: `${area.demographics.ownerOccupied}%` },
                    { label: "Vibe", value: area.demographics.vibe },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-[#404945] text-xs font-bold uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="text-[#1a1c1c] font-bold text-lg">{item.value}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 2-col: Content + Expert Sidebar */}
              <div className="grid lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-6">
                  <h2 className="text-2xl font-bold font-heading">About {area.name}</h2>
                  <p className="text-[--color-on-surface-variant] leading-relaxed">
                    {area.description}
                  </p>
                </div>

                {/* Expert Sidebar */}
                <div className="sticky top-8 bg-[#faf9f8] rounded-2xl p-6 h-fit">
                  <div className="relative mb-4">
                    <div className="size-16 rounded-full bg-brand-primary/10 flex items-center justify-center">
                      <span className="text-brand-primary font-bold text-xl">{area.agent.initials}</span>
                    </div>
                    <span className="absolute bottom-0 right-0 bg-[--color-success] size-4 rounded-full border-2 border-surface-container-lowest" />
                  </div>
                  <p className="text-lg font-bold text-[#1a1c1c]">{area.agent.name}</p>
                  <p className="text-sm text-brand-primary font-semibold mb-3">{area.agent.role}</p>
                  <p className="text-sm text-[#404945] italic mb-6">&ldquo;{area.agent.quote}&rdquo;</p>
                  <button className="w-full bg-brand-primary text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 mb-3 hover:bg-brand-primary/90 transition-colors">
                    <Phone className="size-4" /> Speak to {area.agent.name.split(" ")[0]}
                  </button>
                  <button className="w-full bg-brand-primary/10 text-brand-primary font-semibold py-3 rounded-xl hover:bg-brand-primary/20 transition-colors flex items-center justify-center gap-2">
                    <Calendar className="size-4" /> Book a Viewing
                  </button>
                </div>
              </div>

              {/* Property Listings (4-col grid) */}
              <section>
                <h2 className="text-2xl font-bold font-heading mb-6">Properties in {area.postcode}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {MOCK_LISTINGS.map((listing) => (
                    <div
                      key={listing.address}
                      className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="relative h-40 bg-[#f4f3f2]">
                        <span className="absolute top-2 left-2 bg-surface-container-lowest/95 text-brand-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {listing.status}
                        </span>
                      </div>
                      <div className="p-4">
                        <p className="text-brand-primary font-bold text-lg">{listing.price}</p>
                        <p className="font-semibold text-sm text-[#1a1c1c] truncate">{listing.address}</p>
                        <div className="flex items-center gap-3 text-[#404945] text-xs mt-2">
                          <span className="flex items-center gap-1"><Bed className="size-3" /> {listing.beds}</span>
                          <span className="flex items-center gap-1"><Bath className="size-3" /> {listing.baths}</span>
                          <span className="flex items-center gap-1"><Maximize2 className="size-3" /> {listing.sqft}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* AreaSearchCTA */}
              <AreaSearchCTA areaName={area.name} citySlug={area.citySlug} areaSlug={area.slug} />

              {/* Newsletter CTA */}
              <section className="rounded-3xl bg-primary text-white p-10 md:p-16 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16" />
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold font-heading mb-3">Get {area.postcode} market updates</h2>
                  <p className="text-white/80 mb-6 text-sm">Be the first to know about new listings and price changes.</p>
                  <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                    <input
                      type="email"
                      placeholder="Your email"
                      className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 outline-none text-sm"
                    />
                    <button className="bg-white text-primary font-bold px-6 py-3 rounded-xl text-sm hover:bg-[--color-surface-container-low] transition-colors">
                      Join Waitlist
                    </button>
                  </div>
                </div>
              </section>

              {/* Internal Links */}
              <section className="grid md:grid-cols-3 gap-4">
                <InternalLinkCard
                  title={`Sold Prices in ${area.name}`}
                  description="Recent transactions near you"
                  href={`/sold-prices/${area.slug}`}
                />
                <InternalLinkCard
                  title={`${area.cityName} Area Guide`}
                  description="Explore the wider city"
                  href={`/areas/${area.citySlug}`}
                />
                <InternalLinkCard
                  title={`${area.cityName} Statistics`}
                  description="Price data and market trends"
                  href={`/areas/${area.citySlug}/stats`}
                />
              </section>
            </div>
          </TabsContent>

          {/* ── Tab 2: Market Data ── */}
          <TabsContent value="market">
            <div className="space-y-8">
              {/* Header actions */}
              <div className="flex justify-end gap-3">
                <button className="flex items-center gap-2 bg-brand-primary/10 text-brand-primary px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-primary/20 transition-colors">
                  <Share2 className="size-4" /> Share
                </button>
                {/* PrintButton is "use client" — window.print() cannot be called in a Server Component */}
                <PrintButton />
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main column (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Price Trend Card */}
                  <div className="bg-surface-container-lowest rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                      <h3 className="font-bold text-[#1a1c1c]">Average Property Price Trends</h3>
                      <select className="text-sm bg-[#faf9f8] rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-brand-primary/20 text-[#1a1c1c]">
                        <option>Last 5 Years</option>
                        <option>Last 12 Months</option>
                      </select>
                    </div>
                    <AreaPriceTrendClient />
                    <div className="mt-4 bg-brand-primary/5 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#404945] font-medium">Current avg price</p>
                        <p className="text-3xl font-bold text-brand-primary font-heading">{area.avgPriceFormatted}</p>
                      </div>
                      <p className="text-[--color-success] flex items-center gap-1 font-semibold">
                        <TrendingUp className="size-4" /> {area.yoyChange} YoY
                      </p>
                    </div>
                    <DataAttribution source="HM Land Registry Price Paid Data" />
                  </div>

                  {/* Listings vs Sold Volume */}
                  <div className="bg-surface-container-lowest rounded-xl shadow-sm p-6">
                    <h3 className="font-bold text-[#1a1c1c] mb-4">New Listings vs Sold Volume</h3>
                    <ListingVolumeClient />
                    <DataAttribution source="Britestate Market Intelligence" />
                  </div>
                </div>

                {/* Sidebar (1/3) */}
                <div className="space-y-6">
                  {/* Property Types Donut */}
                  <div className="bg-surface-container-lowest rounded-xl shadow-sm p-6">
                    <h3 className="font-bold text-[#1a1c1c] mb-4">Property Types</h3>
                    <PropertyDonutClient />
                  </div>

                  {/* Demographics */}
                  <div className="bg-surface-container-lowest rounded-xl shadow-sm p-6">
                    <h3 className="font-bold text-[#1a1c1c] mb-4">Demographics</h3>
                    <div className="space-y-3">
                      {[
                        { label: "Owner Occupied", pct: area.demographics.ownerOccupied },
                        { label: "Private Rented", pct: area.demographics.privateRented },
                        { label: "Social Rented", pct: area.demographics.socialRented },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex justify-between text-xs text-[#404945] mb-1">
                            <span>{item.label}</span>
                            <span className="font-bold">{item.pct}%</span>
                          </div>
                          <div className="bg-brand-primary/5 rounded-full h-1.5">
                            <div className="bg-brand-primary h-1.5 rounded-full" style={{ width: `${item.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Connectivity */}
                  <div className="bg-brand-primary text-white rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-bold text-sm">Ultrafast Broadband</p>
                      <span className="bg-white/20 text-xs font-bold px-2 py-0.5 rounded-full">{area.broadband.coverage5g ? "5G Available" : "4G"}</span>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 mb-3">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-xs text-white/60">Download</p>
                          <p className="text-2xl font-black">{area.broadband.download}<span className="text-sm font-normal ml-1">Mbps</span></p>
                        </div>
                        <div>
                          <p className="text-xs text-white/60">Upload</p>
                          <p className="text-2xl font-black">{area.broadband.upload}<span className="text-sm font-normal ml-1">Mbps</span></p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Wifi className="size-4 text-white/60" />
                      <span className="text-white/80">{area.broadband.coverage5g ? "5G Available" : "4G Coverage"}</span>
                    </div>
                  </div>

                  {/* Crime Index */}
                  <div className="bg-surface-container-lowest rounded-xl shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldCheck className="size-5 text-brand-primary" />
                      <h3 className="font-bold text-[#1a1c1c]">Crime Index</h3>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: area.name, level: area.crimeIndex.local <= 60 ? "Low" : area.crimeIndex.local <= 90 ? "Average" : "High", color: area.crimeIndex.local <= 60 ? "bg-[--color-success]" : area.crimeIndex.local <= 90 ? "bg-amber-400" : "bg-red-500", pct: Math.min(area.crimeIndex.local, 100) },
                        { label: area.borough, level: area.crimeIndex.borough <= 60 ? "Low" : area.crimeIndex.borough <= 90 ? "Average" : "High", color: area.crimeIndex.borough <= 60 ? "bg-[--color-success]" : area.crimeIndex.borough <= 90 ? "bg-amber-400" : "bg-red-500", pct: Math.min(area.crimeIndex.borough, 100) },
                        { label: area.cityName, level: area.crimeIndex.city <= 60 ? "Low" : area.crimeIndex.city <= 90 ? "Average" : "High", color: "bg-[#e3e2e1]", pct: Math.min(area.crimeIndex.city, 100) },
                      ].map((row) => (
                        <div key={row.label}>
                          <div className="flex justify-between text-xs text-[#404945] mb-1">
                            <span>{row.label}</span>
                            <span className="font-medium">{row.level}</span>
                          </div>
                          <div className="bg-[#f4f3f2] rounded-full h-1.5">
                            <div className={`${row.color} h-1.5 rounded-full`} style={{ width: `${row.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <DataAttribution source="Metropolitan Police Crime Statistics" />
                  </div>
                </div>
              </div>

              {/* Full-width map */}
              <div className="relative h-80 rounded-2xl overflow-hidden shadow-lg">
                <MapEmbedClient latitude={area.coordinates.lat} longitude={area.coordinates.lng} zoom={13} className="w-full h-full" />
              </div>
            </div>
          </TabsContent>

          {/* ── Tab 3: Transport ── */}
          <TabsContent value="transport">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold font-heading">Transport &amp; Connectivity</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {area.transportLinks.map((item) => (
                  <div key={item.name} className="bg-[#faf9f8] rounded-xl p-5 flex items-center gap-4">
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <p className="font-semibold text-[#1a1c1c]">{item.name}</p>
                      <p className="text-sm text-[#404945]">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── Tab 4: Schools ── */}
          <TabsContent value="schools">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold font-heading">Schools in Catchment</h2>
              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-brand-primary/10 text-brand-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    {area.schools.length} schools
                  </span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School Name</TableHead>
                      <TableHead>Ofsted</TableHead>
                      <TableHead>Distance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {area.schools.map((school) => (
                      <TableRow key={school.name} className="hover:bg-brand-primary/5 transition-colors">
                        <TableCell className="font-medium">{school.name}</TableCell>
                        <TableCell><OfstedBadge rating={school.ofsted} /></TableCell>
                        <TableCell className="text-[#404945]">{school.distance}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <DataAttribution source="Department for Education (DfE) 2024" />
              </div>
            </div>
          </TabsContent>

          {/* ── Tab 5: Lifestyle ── */}
          <TabsContent value="lifestyle">
            <div className="space-y-8">
              <h2 className="text-2xl font-bold font-heading">Life in {area.name}</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {area.localFavourites.map(({ label, desc, category }) => {
                  const Icon = CATEGORY_ICON_MAP[category] ?? Trees;
                  const colorMap: Record<string, string> = { park: "text-[--color-brand-primary-light]", cafe: "text-[--color-brand-secondary-dark]", pub: "text-[--color-brand-secondary-dark]", attraction: "text-[--color-info]" };
                  const color = colorMap[category] ?? "text-brand-primary";
                  return (
                    <div key={label} className="bg-[#faf9f8] rounded-xl p-6">
                      <Icon className={`size-8 ${color} mb-4`} />
                      <p className="font-semibold text-[#1a1c1c] text-lg mb-2">{label}</p>
                      <p className="text-sm text-[#404945]">{desc}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-[#404945] leading-relaxed max-w-3xl">
                {area.name} is known for its community spirit and character. {area.description}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
