import type { Metadata } from "next";
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

export const revalidate = 86400;

type AreaPageProps = Readonly<{ params: Promise<{ city: string; area: string }> }>;

export async function generateMetadata({ params }: AreaPageProps): Promise<Metadata> {
  const { city, area } = await params;
  const name = area.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const cityName = city.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${name} Area Guide — ${MOCK_AREA.postcode} | Britestate`,
    description: `Discover ${name}: property prices, schools, transport and lifestyle in ${cityName}.`,
    alternates: { canonical: `/areas/${city}/${area}` },
  };
}

const MOCK_AREA = {
  name: "Isleworth",
  postcode: "TW7",
  borough: "Hounslow",
  description: "A charming riverside suburb blending historic character with modern connectivity. From the picturesque Old Isleworth to the well-connected Spring Grove.",
  greenSpace: "92%",
  walkability: "High",
  noise: "Quiet",
  avgPrice: "£542,000",
  yoy: "+3.8%",
};

const MOCK_AGENT = {
  name: "Marcus Thompson",
  role: "TW7 Specialist",
  quote: "Isleworth is one of West London's best-kept secrets. I've helped over 150 families find their perfect home here.",
  initials: "MT",
};

const MOCK_LISTINGS = [
  { price: "£485,000", address: "14 South Street, TW7 7BG", beds: 3, baths: 2, status: "For Sale", sqft: "1,100" },
  { price: "£375,000", address: "Nazareth House, TW7 5NR", beds: 2, baths: 1, status: "Reduced", sqft: "750" },
  { price: "£650,000", address: "Twickenham Road, TW7 6DB", beds: 4, baths: 2, status: "New", sqft: "1,450" },
  { price: "£350,000", address: "Worton Road, TW7 6ER", beds: 1, baths: 1, status: "For Sale", sqft: "560" },
];

const MOCK_SCHOOLS = [
  { name: "The Blue School (CE)", ofsted: "Outstanding" as const, distance: "0.3 mi" },
  { name: "Isleworth & Syon School", ofsted: "Good" as const, distance: "0.6 mi" },
  { name: "Marlborough Primary", ofsted: "Outstanding" as const, distance: "0.8 mi" },
  { name: "Gumley House Convent", ofsted: "Outstanding" as const, distance: "1.1 mi" },
];

const MOCK_LOCAL_FAVOURITES = [
  { icon: Trees, color: "text-emerald-600", label: "Osterley Park", desc: "Stunning National Trust grounds with 18th-century house" },
  { icon: Coffee, color: "text-amber-600", label: "The London Apprentice", desc: "Historic riverside pub dating to the 16th century" },
  { icon: GraduationCap, color: "text-blue-600", label: "West Thames College", desc: "Further education and community learning hub" },
];

function OfstedBadge({ rating }: Readonly<{ rating: "Outstanding" | "Good" | "Requires Improvement" }>) {
  const classes = {
    Outstanding: "bg-emerald-100 text-emerald-800",
    Good: "bg-blue-100 text-blue-800",
    "Requires Improvement": "bg-amber-100 text-amber-800",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${classes[rating]}`}>
      {rating}
    </span>
  );
}

export default async function AreaPage({ params }: AreaPageProps) {
  const { city, area } = await params;
  const cityName = city.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Breadcrumb ── */}
        <nav className="text-sm text-neutral-500 mb-8 flex items-center gap-2" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/areas" className="hover:text-primary">Area Guides</Link>
          <span>/</span>
          <Link href={`/areas/${city}`} className="hover:text-primary">{cityName}</Link>
          <span>/</span>
          <span className="text-neutral-900 font-medium">{MOCK_AREA.name}</span>
        </nav>

        {/* ── Split Hero ── */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16 items-start">
          {/* Left: Text */}
          <div>
            <span className="inline-block bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
              {MOCK_AREA.borough}
            </span>
            <h1 className="font-heading font-black text-neutral-900 mb-4 max-lg:text-[36px]" style={{ fontSize: "clamp(36px,4vw,56px)", lineHeight: 1.1 }}>
              Life in {MOCK_AREA.postcode} —<br />{MOCK_AREA.name}
            </h1>
            <p className="text-lg text-neutral-600 leading-relaxed mb-8 max-w-lg">
              {MOCK_AREA.description}
            </p>
            {/* 3 mini stat cards */}
            <div className="flex flex-wrap gap-4">
              {[
                { value: MOCK_AREA.greenSpace, label: "Green Space" },
                { value: MOCK_AREA.walkability, label: "Walkability" },
                { value: MOCK_AREA.noise, label: "Noise Level" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white border border-neutral-100 shadow-sm rounded-xl p-4 min-w-[140px]">
                  <p className="text-primary font-bold text-2xl">{stat.value}</p>
                  <p className="text-neutral-500 text-xs font-medium uppercase tracking-tight mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Map */}
          <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl border-4 border-white">
            <MapEmbedClient
              latitude={51.4754}
              longitude={-0.3368}
              zoom={13}
              className="w-full h-full"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-3 flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                <MapPin className="size-4 text-primary" />
                {MOCK_AREA.postcode} Boundary Overview
              </div>
              <button className="bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-bold">
                Interactive Map
              </button>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="overview">
          <TabsList variant="line" className="w-full border-b border-neutral-200 mb-10 rounded-none h-auto pb-0">
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
                  {MOCK_LOCAL_FAVOURITES.map(({ icon: Icon, color, label, desc }) => (
                    <div key={label} className="bg-white border border-neutral-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <Icon className={`size-6 ${color} mb-3`} />
                      <p className="font-bold text-neutral-900">{label}</p>
                      <p className="text-sm text-neutral-500">{desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Demographic Snapshot */}
              <section className="bg-primary/5 border border-primary/10 rounded-2xl p-8">
                <h2 className="text-2xl font-bold font-heading mb-6">Demographic Snapshot</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: "Top Group", value: "Families" },
                    { label: "Median Age", value: "37" },
                    { label: "Ownership", value: "58%" },
                    { label: "Vibe", value: "Suburban" },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="text-neutral-900 font-bold text-lg">{item.value}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 2-col: Content + Expert Sidebar */}
              <div className="grid lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-6">
                  <h2 className="text-2xl font-bold font-heading">About {MOCK_AREA.name}</h2>
                  <p className="text-neutral-600 leading-relaxed">
                    Isleworth is one of West London&apos;s best-kept secrets, a riverside suburb that combines the charm of a historic village with the convenience of excellent transport links. Situated within the London Borough of Hounslow, it straddles the banks of the Thames near its confluence with the Duke of Northumberland&apos;s River.
                  </p>
                  <p className="text-neutral-600 leading-relaxed">
                    For commuters, Isleworth station provides regular South Western Railway services to Waterloo in around 37 minutes, while the Piccadilly Line is accessible from both Osterley and Hounslow East. With average house prices still below the wider London average, Isleworth represents compelling value.
                  </p>
                </div>

                {/* Expert Sidebar */}
                <div className="sticky top-8 bg-white border border-primary/10 rounded-2xl shadow-sm p-6 h-fit">
                  <div className="relative mb-4">
                    <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                      <span className="text-primary font-bold text-xl">{MOCK_AGENT.initials}</span>
                    </div>
                    <span className="absolute bottom-0 right-0 bg-green-500 size-4 rounded-full border-2 border-white" />
                  </div>
                  <p className="text-lg font-bold text-neutral-900">{MOCK_AGENT.name}</p>
                  <p className="text-sm text-primary font-semibold mb-3">{MOCK_AGENT.role}</p>
                  <p className="text-sm text-neutral-600 italic mb-6">&ldquo;{MOCK_AGENT.quote}&rdquo;</p>
                  <button className="w-full bg-primary text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mb-3 hover:bg-primary/90 transition-colors">
                    <Phone className="size-4" /> Speak to {MOCK_AGENT.name.split(" ")[0]}
                  </button>
                  <button className="w-full border border-primary/20 text-primary font-bold py-3 rounded-xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                    <Calendar className="size-4" /> Book a Viewing
                  </button>
                </div>
              </div>

              {/* Property Listings (4-col grid) */}
              <section>
                <h2 className="text-2xl font-bold font-heading mb-6">Properties in {MOCK_AREA.postcode}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {MOCK_LISTINGS.map((listing) => (
                    <div
                      key={listing.address}
                      className="bg-white rounded-xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="relative h-40 bg-neutral-200">
                        <span className="absolute top-2 left-2 bg-white/90 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          {listing.status}
                        </span>
                      </div>
                      <div className="p-4">
                        <p className="text-primary font-bold text-lg">{listing.price}</p>
                        <p className="font-semibold text-sm text-neutral-900 truncate">{listing.address}</p>
                        <div className="flex items-center gap-3 text-neutral-500 text-xs mt-2">
                          <span className="flex items-center gap-1"><Bed className="size-3" /> {listing.beds}</span>
                          <span className="flex items-center gap-1"><Bath className="size-3" /> {listing.baths}</span>
                          <span className="flex items-center gap-1"><Maximize2 className="size-3" /> {listing.sqft}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Newsletter CTA */}
              <section className="rounded-3xl bg-primary text-white p-10 md:p-16 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16" />
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold font-heading mb-3">Get {MOCK_AREA.postcode} market updates</h2>
                  <p className="text-white/80 mb-6 text-sm">Be the first to know about new listings and price changes.</p>
                  <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                    <input
                      type="email"
                      placeholder="Your email"
                      className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 outline-none text-sm"
                    />
                    <button className="bg-white text-primary font-bold px-6 py-3 rounded-xl text-sm hover:bg-neutral-100 transition-colors">
                      Join Waitlist
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </TabsContent>

          {/* ── Tab 2: Market Data ── */}
          <TabsContent value="market">
            <div className="space-y-8">
              {/* Header actions */}
              <div className="flex justify-end gap-3">
                <button className="flex items-center gap-2 border border-primary/20 text-primary px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/5 transition-colors">
                  <Share2 className="size-4" /> Share
                </button>
                {/* PrintButton is "use client" — window.print() cannot be called in a Server Component */}
                <PrintButton />
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main column (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Price Trend Card */}
                  <div className="bg-white rounded-xl border border-primary/10 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                      <h3 className="font-bold text-neutral-900">Average Property Price Trends</h3>
                      <select className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 outline-none focus:border-primary">
                        <option>Last 5 Years</option>
                        <option>Last 12 Months</option>
                      </select>
                    </div>
                    <AreaPriceTrendClient />
                    <div className="mt-4 bg-primary/5 p-4 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-xs text-neutral-500 font-medium">Current avg price</p>
                        <p className="text-3xl font-black text-primary font-heading">{MOCK_AREA.avgPrice}</p>
                      </div>
                      <p className="text-emerald-600 flex items-center gap-1 font-bold">
                        <TrendingUp className="size-4" /> {MOCK_AREA.yoy} YoY
                      </p>
                    </div>
                  </div>

                  {/* Listings vs Sold Volume */}
                  <div className="bg-white rounded-xl border border-primary/10 shadow-sm p-6">
                    <h3 className="font-bold text-neutral-900 mb-4">New Listings vs Sold Volume</h3>
                    <ListingVolumeClient />
                  </div>

                  {/* Schools Table */}
                  <div className="bg-white rounded-xl border border-primary/10 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-neutral-900">Schools in Catchment</h3>
                      <span className="bg-primary/5 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                        {MOCK_SCHOOLS.length} schools
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
                        {MOCK_SCHOOLS.map((school) => (
                          <TableRow key={school.name} className="hover:bg-primary/5 transition-colors">
                            <TableCell className="font-medium">{school.name}</TableCell>
                            <TableCell><OfstedBadge rating={school.ofsted} /></TableCell>
                            <TableCell className="text-neutral-500">{school.distance}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <p className="text-[10px] text-neutral-400 italic mt-4">Source: Department for Education (DfE) 2024</p>
                  </div>
                </div>

                {/* Sidebar (1/3) */}
                <div className="space-y-6">
                  {/* Property Types Donut */}
                  <div className="bg-white rounded-xl border border-primary/10 shadow-sm p-6">
                    <h3 className="font-bold text-neutral-900 mb-4">Property Types</h3>
                    <PropertyDonutClient />
                  </div>

                  {/* Demographics */}
                  <div className="bg-white rounded-xl border border-primary/10 shadow-sm p-6">
                    <h3 className="font-bold text-neutral-900 mb-4">Demographics</h3>
                    <div className="space-y-3">
                      {[
                        { label: "Owner Occupied", pct: 58 },
                        { label: "Private Rented", pct: 28 },
                        { label: "Social Rented", pct: 14 },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex justify-between text-xs text-neutral-600 mb-1">
                            <span>{item.label}</span>
                            <span className="font-bold">{item.pct}%</span>
                          </div>
                          <div className="bg-primary/5 rounded-full h-1.5">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${item.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Connectivity */}
                  <div className="bg-primary text-white rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-bold text-sm">Ultrafast Broadband</p>
                      <span className="bg-white/20 text-xs font-bold px-2 py-0.5 rounded-full">98% Coverage</span>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 mb-3">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-xs text-white/60">Download</p>
                          <p className="text-2xl font-black">900<span className="text-sm font-normal ml-1">Mbps</span></p>
                        </div>
                        <div>
                          <p className="text-xs text-white/60">Upload</p>
                          <p className="text-2xl font-black">110<span className="text-sm font-normal ml-1">Mbps</span></p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Wifi className="size-4 text-white/60" />
                      <span className="text-white/80">5G Available</span>
                    </div>
                  </div>

                  {/* Crime Index */}
                  <div className="bg-white rounded-xl border border-primary/10 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldCheck className="size-5 text-primary" />
                      <h3 className="font-bold text-neutral-900">Crime Index</h3>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: "Isleworth", level: "Low", color: "bg-emerald-500", pct: 30 },
                        { label: "Hounslow", level: "Average", color: "bg-amber-400", pct: 55 },
                        { label: "London", level: "Average", color: "bg-slate-300", pct: 65 },
                      ].map((row) => (
                        <div key={row.label}>
                          <div className="flex justify-between text-xs text-neutral-600 mb-1">
                            <span>{row.label}</span>
                            <span className="font-medium">{row.level}</span>
                          </div>
                          <div className="bg-neutral-100 rounded-full h-1.5">
                            <div className={`${row.color} h-1.5 rounded-full`} style={{ width: `${row.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-neutral-400 italic mt-4">Source: Metropolitan Police Crime Statistics</p>
                  </div>
                </div>
              </div>

              {/* Full-width map */}
              <div className="relative h-80 rounded-2xl overflow-hidden border-4 border-white shadow-xl">
                <MapEmbedClient latitude={51.4754} longitude={-0.3368} zoom={13} className="w-full h-full" />
              </div>
            </div>
          </TabsContent>

          {/* ── Tab 3: Transport ── */}
          <TabsContent value="transport">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold font-heading">Transport &amp; Connectivity</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { icon: "🚂", name: "London Waterloo", detail: "37 mins via SWR" },
                  { icon: "✈️", name: "Heathrow Airport", detail: "15 mins drive (M4)" },
                  { icon: "🚇", name: "Osterley (Piccadilly)", detail: "1.2 miles away" },
                  { icon: "🚇", name: "Hounslow East (Piccadilly)", detail: "1.5 miles away" },
                ].map((item) => (
                  <div key={item.name} className="bg-white border border-primary/10 rounded-xl p-5 flex items-center gap-4">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="font-bold text-neutral-900">{item.name}</p>
                      <p className="text-sm text-neutral-500">{item.detail}</p>
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
              <div className="bg-white rounded-xl border border-primary/10 p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School Name</TableHead>
                      <TableHead>Ofsted</TableHead>
                      <TableHead>Distance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_SCHOOLS.map((school) => (
                      <TableRow key={school.name} className="hover:bg-primary/5 transition-colors">
                        <TableCell className="font-medium">{school.name}</TableCell>
                        <TableCell><OfstedBadge rating={school.ofsted} /></TableCell>
                        <TableCell className="text-neutral-500">{school.distance}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-[10px] text-neutral-400 italic mt-4">Source: Department for Education (DfE) 2024</p>
              </div>
            </div>
          </TabsContent>

          {/* ── Tab 5: Lifestyle ── */}
          <TabsContent value="lifestyle">
            <div className="space-y-8">
              <h2 className="text-2xl font-bold font-heading">Life in {MOCK_AREA.name}</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {MOCK_LOCAL_FAVOURITES.map(({ icon: Icon, color, label, desc }) => (
                  <div key={label} className="bg-white border border-neutral-100 rounded-xl p-6">
                    <Icon className={`size-8 ${color} mb-4`} />
                    <p className="font-bold text-neutral-900 text-lg mb-2">{label}</p>
                    <p className="text-sm text-neutral-500">{desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-neutral-600 leading-relaxed max-w-3xl">
                {MOCK_AREA.name} is known for its community spirit and slower pace of life without sacrificing the benefits of London living. Residents enjoy the proximity to the River Thames, with the &ldquo;Town Wharf&rdquo; being a popular spot for weekend strolls and local pub visits. Osterley Park, a National Trust property just minutes away, offers 140 acres of parkland for walking, cycling and outdoor events.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
