# Phase 2: Property Portal - Research

**Researched:** 2026-03-07
**Domain:** Property search engine, listing management, interactive maps, image pipeline, geospatial queries
**Confidence:** HIGH

## Summary

Phase 2 builds the core property portal functionality on top of the Phase 1 foundation: a property search engine with location-based queries (postcode/area/map), filter/sort/pagination, an interactive map with clustered pins (MapLibre GL JS + MapTiler), polygon draw-to-search, property listing CRUD with image uploads (up to 30 photos, client-side compressed), floor plans, pricing qualifiers, listing analytics, saved searches with alerts, and shortlisting. The database layer requires PostGIS for geospatial queries, full-text search with tsvector, a materialized view for search performance, and cursor-based pagination.

The primary technical challenges are: (1) performant search across properties + listings tables with geospatial, full-text, and filter queries; (2) an image upload pipeline with client-side compression before upload and server-side processing (sharp) for optimization/EXIF stripping; (3) integrating MapLibre GL JS with marker clustering (supercluster) for smooth map interactions; and (4) the polygon draw-to-search feature using terra-draw with MapLibre.

The Epic 2 spec provides an extremely detailed technical audit with production-grade schema, search functions, and security analysis. The spec's recommendations are sound and should be followed with adaptations for the actual stack (MapLibre not Mapbox/Leaflet, `@vis.gl/react-maplibre` as the React wrapper, postcodes.io for UK geocoding).

**Primary recommendation:** Use PostgreSQL FTS + PostGIS + materialized views for search (no external search service at MVP), `@vis.gl/react-maplibre` + `maplibre-gl` + `supercluster` for maps, `browser-image-compression` for client-side image compression, and `sharp` for server-side processing. Geocode via postcodes.io (free, no auth required). Use `@tanstack/react-query` for client-side data fetching with server-side prefetching.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SRCH-01 | User can search properties by location (postcode, area, region) | postcodes.io geocoding -> PostGIS radius search via `search_listings_by_radius` RPC function |
| SRCH-02 | User can filter by property type, price range, bedrooms, bathrooms | Materialized view `search_listings` with composite indexes, Zod validation on search params |
| SRCH-03 | User can filter by amenities, EPC rating, new build status | JSONB `features` column with GIN index, `epc_rating` column with index on materialized view |
| SRCH-04 | User can search via interactive map with property pins (MapLibre + MapTiler) | `@vis.gl/react-maplibre` v8.1 + `maplibre-gl` v5.19 + MapTiler style URL |
| SRCH-05 | Map displays property clusters at zoom levels for performance | `supercluster` library for client-side clustering, MapLibre native source clustering as fallback |
| SRCH-06 | User can draw custom search area on map (polygon tool) | `terra-draw` + `terra-draw-maplibre-gl-adapter` for polygon drawing, PostGIS `ST_Within` for spatial query |
| SRCH-07 | User can save properties to shortlist | `saved_properties` table with user_id/listing_id unique constraint, RLS policy, optimistic UI via react-query |
| SRCH-08 | User can save search criteria with notification preferences | `saved_searches` table with JSONB `filters` column and alert preferences |
| SRCH-09 | User receives alerts for new matching properties (email + in-app) | Supabase Edge Function on cron schedule, checks saved searches against new listings, sends via Resend |
| SRCH-10 | User can sort results by price, date, relevance | Sort parameter in search API with indexed columns (price, listed_date, ts_rank for relevance) |
| SRCH-11 | Search uses optimized queries (materialized views, FTS, cursor-based pagination) | Materialized view `search_listings`, tsvector FTS with weighted ranking, cursor pagination via keyset |
| SRCH-12 | Geocoding via postcodes.io (free UK postcode API) | postcodes.io REST API -- no auth required, bulk lookup, reverse geocoding, autocomplete |
| LIST-01 | Agent/seller can create property listing with full details | Properties + listings tables with Zod validation, multi-step form with react-hook-form |
| LIST-02 | Agent/seller can upload up to 30 photos with client-side compression | `browser-image-compression` on client, `sharp` on server for WebP conversion/EXIF strip, Supabase Storage |
| LIST-03 | Agent/seller can upload floor plans and documents | Supabase Storage `property-documents` bucket, PDF/image validation, `property_media` table with media_type |
| LIST-04 | Agent/seller can set pricing with qualifiers | `price`, `price_qualifier`, `rent_frequency` columns on listings table with CHECK constraints |
| LIST-05 | Agent/seller can edit and update live listings | Update mutations via Supabase client, RLS ensures user_id = auth.uid(), materialized view refresh |
| LIST-06 | Agent/seller can view listing analytics (views, saves, enquiries) | `view_count`, `favorite_count`, `enquiry_count` on listings, `search_analytics` table for deeper insights |
| LIST-07 | Price history tracked for each listing | `price_history` table with trigger on listings price updates, stores old_price/new_price/changed_at |
| LIST-08 | PostGIS geospatial support for location-based queries | PostGIS extension enabled in Supabase, `coordinates GEOGRAPHY(POINT, 4326)` column, GIST index |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `maplibre-gl` | ^5.19.0 | Vector map rendering engine | Open-source fork of Mapbox GL JS, required by project constraints (MapTiler + MapLibre) |
| `@vis.gl/react-maplibre` | ^8.1.0 | React wrapper for MapLibre GL JS | Official vis.gl React binding, spun off from react-map-gl for dedicated MapLibre support |
| `supercluster` | ^8.0.1 | Geospatial point clustering | Industry standard for map marker clustering, handles 100K+ points efficiently |
| `terra-draw` | ^1.0.0 | Drawing polygons/shapes on maps | Modern MapLibre drawing plugin, replaces unmaintained mapbox-gl-draw |
| `terra-draw-maplibre-gl-adapter` | ^1.0.0 | Terra Draw adapter for MapLibre | Required adapter to connect terra-draw with MapLibre GL JS |
| `browser-image-compression` | ^2.0.2 | Client-side image compression | Web Worker-based, non-blocking, supports JPEG/PNG/WebP, configurable quality/size |
| `sharp` | ^0.34.5 | Server-side image processing | Fastest Node.js image processor, WebP conversion, EXIF stripping, thumbnail generation |
| `file-type` | ^19.0.0 | MIME type detection via magic bytes | Server-side validation of actual file content (not just extension) |
| `@tanstack/react-query` | ^5.62.0 | Async state management | Server prefetching + client cache, optimistic updates for saves/shortlists |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@upstash/redis` | ^1.34.0 | Search result caching | Cache popular search queries (30s TTL), rate limiting |
| `nuqs` | ^2.0.0 | Type-safe URL search params | Sync search filters with URL state for shareable search links |
| `react-dropzone` | ^14.3.0 | Drag-and-drop file uploads | Image upload UI with drag-drop, file validation, preview |
| `use-debounce` | ^10.0.0 | Input debouncing | Debounce search input, postcode autocomplete (300ms) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@vis.gl/react-maplibre` | `react-map-gl/maplibre` | react-maplibre is the dedicated MapLibre fork, simpler API, actively maintained |
| `terra-draw` | `@mapbox/mapbox-gl-draw` | mapbox-gl-draw is no longer maintained, terra-draw is the modern replacement for MapLibre |
| `browser-image-compression` | `@image/compressor` | browser-image-compression has larger ecosystem, web worker support, more downloads |
| `supercluster` | MapLibre native clustering | Supercluster gives more control over cluster rendering and interaction |
| Meilisearch/Algolia | PostgreSQL FTS | External search adds cost + sync complexity; PostgreSQL FTS is sufficient up to ~100K listings |

**Installation:**
```bash
cd britv3.0
pnpm add maplibre-gl @vis.gl/react-maplibre supercluster terra-draw terra-draw-maplibre-gl-adapter browser-image-compression sharp file-type @tanstack/react-query @upstash/redis nuqs react-dropzone use-debounce
pnpm add -D @types/supercluster @types/geojson
```

## Architecture Patterns

### Recommended Project Structure (Phase 2)
```
britv3.0/src/
├── app/
│   ├── (main)/
│   │   ├── search/
│   │   │   └── page.tsx              # Search results page (Server Component with prefetch)
│   │   └── properties/
│   │       ├── [slug]/
│   │       │   └── page.tsx          # Property detail page (Server Component)
│   │       └── page.tsx              # Browse/discover page
│   ├── (protected)/
│   │   ├── dashboard/
│   │   │   ├── [role]/
│   │   │   │   ├── listings/
│   │   │   │   │   ├── page.tsx      # My listings (agent/seller)
│   │   │   │   │   ├── new/page.tsx  # Create listing
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx  # Edit listing
│   │   │   │   │       └── analytics/page.tsx  # Listing analytics
│   │   │   │   ├── saved/page.tsx    # Saved properties shortlist
│   │   │   │   └── searches/page.tsx # Saved searches + alerts
│   ├── api/
│   │   ├── search/route.ts           # Search API with caching
│   │   ├── geocode/route.ts          # Proxy to postcodes.io (cache results)
│   │   ├── listings/
│   │   │   ├── route.ts              # CRUD listings
│   │   │   └── [id]/
│   │   │       ├── route.ts          # Single listing operations
│   │   │       └── media/route.ts    # Image upload + processing
│   │   └── saved/
│   │       ├── properties/route.ts   # Save/unsave properties
│   │       └── searches/route.ts     # Save/delete searches
├── components/
│   ├── search/
│   │   ├── SearchBar.tsx             # Location input + autocomplete
│   │   ├── SearchFilters.tsx         # Filter panel (type, price, beds, etc.)
│   │   ├── SearchResults.tsx         # Results list with pagination
│   │   ├── SearchSortBar.tsx         # Sort controls
│   │   └── PropertyCard.tsx          # Listing card component
│   ├── map/
│   │   ├── PropertyMap.tsx           # Main map component
│   │   ├── MapMarker.tsx             # Custom marker/popup
│   │   ├── MapCluster.tsx            # Cluster indicator
│   │   ├── MapDrawTool.tsx           # Polygon draw control
│   │   └── MapSearchSync.tsx         # Sync map bounds with search
│   ├── listings/
│   │   ├── ListingForm.tsx           # Multi-step listing creation
│   │   ├── ListingFormSteps/
│   │   │   ├── PropertyDetails.tsx   # Address, type, beds, baths
│   │   │   ├── Description.tsx       # Title, description, features
│   │   │   ├── Pricing.tsx           # Price, qualifier, rent details
│   │   │   ├── MediaUpload.tsx       # Photo + floor plan upload
│   │   │   └── Review.tsx            # Preview before publish
│   │   ├── ImageUploader.tsx         # Drag-drop with compression
│   │   ├── ImageGallery.tsx          # Photo gallery with lightbox
│   │   ├── ListingAnalytics.tsx      # Views, saves, enquiries charts
│   │   └── PriceHistory.tsx          # Price change timeline
│   ├── properties/
│   │   ├── PropertyDetail.tsx        # Full property detail view
│   │   ├── PropertyGallery.tsx       # Image gallery for detail page
│   │   ├── PropertyFeatures.tsx      # Feature list
│   │   ├── SaveButton.tsx            # Save to shortlist (heart icon)
│   │   └── ShareButton.tsx           # Share listing
├── hooks/
│   ├── useSearch.ts                  # Search state management
│   ├── usePropertyMap.ts             # Map state (bounds, zoom, clusters)
│   ├── useSavedProperties.ts         # Shortlist CRUD
│   ├── useSavedSearches.ts           # Saved searches CRUD
│   ├── useImageUpload.ts             # Upload with compression + progress
│   └── useGeocode.ts                 # Postcode -> lat/lng
├── services/
│   ├── search/
│   │   ├── search-service.ts         # Search API calls
│   │   └── geocode-service.ts        # postcodes.io wrapper
│   ├── listings/
│   │   ├── listing-service.ts        # Listing CRUD
│   │   └── media-service.ts          # Image upload + processing
│   └── saved/
│       ├── saved-properties-service.ts
│       └── saved-searches-service.ts
├── types/
│   ├── property.ts                   # Property, Listing, Media types
│   ├── search.ts                     # SearchParams, SearchResult types
│   └── map.ts                        # MapBounds, Cluster types
└── lib/
    ├── supabase/                     # (existing from Phase 1)
    ├── search/
    │   └── query-builder.ts          # Build Supabase queries from search params
    ├── upload/
    │   ├── compress.ts               # Client-side compression config
    │   ├── process.ts                # Server-side sharp processing
    │   └── validate.ts               # File type + size validation
    └── map/
        └── cluster.ts                # Supercluster configuration
```

### Pattern 1: Search with Materialized View + Caching
**What:** Use a materialized view (`search_listings`) that pre-joins properties + listings + primary image, with Redis caching for popular queries.
**When to use:** All property search operations.
**Example:**
```typescript
// services/search/search-service.ts
import type { SearchParams } from "@/types/search";
import { createClient } from "@/lib/supabase/server";

export async function searchProperties(params: SearchParams) {
  const supabase = await createClient();

  if (params.lat && params.lng) {
    // PostGIS radius search via RPC function
    const radiusMeters = (params.radius_miles || 5) * 1609.34;
    return supabase.rpc("search_listings_by_radius", {
      center_lat: params.lat,
      center_lng: params.lng,
      radius_meters: radiusMeters,
      p_listing_type: params.listing_type ?? null,
      p_min_price: params.min_price ?? null,
      p_max_price: params.max_price ?? null,
      p_min_bedrooms: params.min_bedrooms ?? null,
      p_property_type: params.property_type?.[0] ?? null,
      p_limit: params.per_page,
      p_cursor: params.cursor ?? null,
    });
  }

  // Filter search on materialized view
  let query = supabase
    .from("search_listings")
    .select("*", { count: "exact" });

  if (params.listing_type) query = query.eq("listing_type", params.listing_type);
  if (params.min_price != null) query = query.gte("price", params.min_price);
  if (params.max_price != null) query = query.lte("price", params.max_price);
  if (params.min_bedrooms != null) query = query.gte("bedrooms", params.min_bedrooms);
  if (params.epc_rating) query = query.lte("epc_rating", params.epc_rating);
  if (params.property_type?.length) query = query.in("property_type", params.property_type);

  // Cursor-based pagination
  if (params.cursor) {
    query = query.gt("listing_id", params.cursor);
  }

  return query.order("listed_date", { ascending: false }).limit(params.per_page);
}
```

### Pattern 2: Client-Side Image Compression Before Upload
**What:** Compress images in the browser before uploading to reduce bandwidth and storage costs.
**When to use:** All image uploads (listing photos, floor plans).
**Example:**
```typescript
// lib/upload/compress.ts
import imageCompression from "browser-image-compression";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 2400,
  useWebWorker: true,
  fileType: "image/webp",
  initialQuality: 0.85,
};

export async function compressImage(file: File): Promise<File> {
  if (file.size <= 500 * 1024) return file; // Skip if already < 500KB
  return imageCompression(file, COMPRESSION_OPTIONS);
}

export async function compressMultiple(
  files: File[],
  onProgress?: (index: number, progress: number) => void,
): Promise<File[]> {
  return Promise.all(
    files.map(async (file, index) => {
      const compressed = await compressImage(file);
      onProgress?.(index, 100);
      return compressed;
    }),
  );
}
```

### Pattern 3: MapLibre with Supercluster
**What:** Render property markers on MapLibre using supercluster for efficient clustering at different zoom levels.
**When to use:** Map view of search results.
**Example:**
```typescript
// components/map/PropertyMap.tsx
"use client";

import { Map, Source, Layer, useMap } from "@vis.gl/react-maplibre";
import type { MapRef } from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

const MAPTILER_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`;

type PropertyMapProps = Readonly<{
  properties: Array<{ id: string; lat: number; lng: number; price: number }>;
  onPropertyClick?: (id: string) => void;
}>;

export function PropertyMap({ properties, onPropertyClick }: PropertyMapProps) {
  const geojson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: properties.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: { id: p.id, price: p.price },
    })),
  };

  return (
    <Map
      initialViewState={{ longitude: -0.1276, latitude: 51.5074, zoom: 10 }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={MAPTILER_STYLE}
    >
      <Source
        id="properties"
        type="geojson"
        data={geojson}
        cluster={true}
        clusterMaxZoom={14}
        clusterRadius={60}
      >
        <Layer
          id="clusters"
          type="circle"
          filter={["has", "point_count"]}
          paint={{
            "circle-color": "#1B4D3E",
            "circle-radius": ["step", ["get", "point_count"], 20, 10, 30, 50, 40],
          }}
        />
        <Layer
          id="cluster-count"
          type="symbol"
          filter={["has", "point_count"]}
          layout={{ "text-field": "{point_count_abbreviated}", "text-size": 14 }}
          paint={{ "text-color": "#ffffff" }}
        />
        <Layer
          id="unclustered-point"
          type="circle"
          filter={["!", ["has", "point_count"]]}
          paint={{ "circle-color": "#1B4D3E", "circle-radius": 8 }}
        />
      </Source>
    </Map>
  );
}
```

### Pattern 4: Server-Side Image Processing Pipeline
**What:** Process uploaded images on the server: validate MIME type, strip EXIF, convert to WebP, generate thumbnails.
**When to use:** API route handler for image uploads.
**Example:**
```typescript
// lib/upload/process.ts
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function processPropertyImage(buffer: Buffer) {
  // 1. Validate actual MIME type (not client-provided)
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ALLOWED_TYPES.includes(detected.mime)) {
    throw new Error(`Invalid file type: ${detected?.mime ?? "unknown"}`);
  }

  // 2. Process with sharp: auto-rotate, strip EXIF, resize, convert to WebP
  const processed = await sharp(buffer)
    .rotate() // Auto-rotate from EXIF orientation
    .resize(2400, 1800, { fit: "inside", withoutEnlargement: true })
    .removeMetadata() // Strip all EXIF data (privacy)
    .webp({ quality: 85 })
    .toBuffer();

  // 3. Generate thumbnail
  const thumbnail = await sharp(buffer)
    .rotate()
    .resize(400, 300, { fit: "cover" })
    .removeMetadata()
    .webp({ quality: 75 })
    .toBuffer();

  return { processed, thumbnail };
}
```

### Pattern 5: Geocoding with postcodes.io
**What:** Convert UK postcodes to lat/lng coordinates and vice versa, with autocomplete.
**When to use:** Location search input, listing creation (address geocoding).
**Example:**
```typescript
// services/search/geocode-service.ts
const POSTCODES_API = "https://api.postcodes.io";

export async function geocodePostcode(postcode: string) {
  const res = await fetch(`${POSTCODES_API}/postcodes/${encodeURIComponent(postcode)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return {
    lat: data.result.latitude as number,
    lng: data.result.longitude as number,
    admin_district: data.result.admin_district as string,
    region: data.result.region as string,
  };
}

export async function autocompletePostcode(partial: string) {
  const res = await fetch(`${POSTCODES_API}/postcodes/${encodeURIComponent(partial)}/autocomplete`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.result as string[];
}

export async function reverseGeocode(lat: number, lng: number) {
  const res = await fetch(`${POSTCODES_API}/postcodes?lon=${lng}&lat=${lat}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.result?.[0] ?? null;
}
```

### Pattern 6: URL State for Search Filters
**What:** Sync search parameters with URL query strings for shareable, bookmarkable search links.
**When to use:** Search page -- all filter state lives in the URL.
**Example:**
```typescript
// hooks/useSearch.ts
"use client";

import { useQueryStates, parseAsString, parseAsInteger, parseAsFloat } from "nuqs";

export function useSearchParams() {
  return useQueryStates({
    q: parseAsString.withDefault(""),
    listing_type: parseAsString.withDefault("sale"),
    min_price: parseAsInteger,
    max_price: parseAsInteger,
    min_bedrooms: parseAsInteger,
    property_type: parseAsString, // comma-separated
    postcode: parseAsString,
    lat: parseAsFloat,
    lng: parseAsFloat,
    radius: parseAsFloat.withDefault(5),
    sort: parseAsString.withDefault("date_desc"),
    cursor: parseAsString,
  });
}
```

### Anti-Patterns to Avoid
- **ILIKE queries on text columns:** Never use `ILIKE '%search%'` on properties. Always use tsvector full-text search with proper indexes.
- **Offset-based pagination at scale:** Use cursor-based (keyset) pagination for search results. Offset degrades linearly -- page 100 scans 2000+ rows.
- **Loading all markers on map:** Never iterate and add individual markers. Use GeoJSON source with built-in clustering or supercluster.
- **Uploading raw images to storage:** Always compress client-side before upload and process server-side (EXIF strip, WebP conversion).
- **Geocoding on every search:** Cache postcodes.io results (postcodes rarely change). Use the geocode API route as a proxy with caching.
- **Trusting client-provided MIME types:** Always verify with magic bytes server-side using `file-type` library.
- **Storing full-size images only:** Generate and store thumbnails alongside full images for list views (90% bandwidth reduction on search pages).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Map marker clustering | Custom DOM marker management | `supercluster` or MapLibre native clustering | Handles 100K+ points, zoom-level transitions, cluster expansion |
| Image compression | Canvas API compression | `browser-image-compression` | Web Worker support, quality tuning, format conversion, battle-tested |
| Image processing | Custom sharp pipelines | Structured `processPropertyImage()` function | EXIF stripping, orientation correction, thumbnail gen -- many edge cases |
| Polygon search | Custom geometry math | `terra-draw` + PostGIS `ST_Within` | Drawing UX, coordinate handling, spatial query optimization |
| Postcode geocoding | Custom geocoding service | postcodes.io REST API | Free, no auth, open data, bulk support, autocomplete built-in |
| URL state management | Manual `searchParams` parsing | `nuqs` | Type-safe, SSR-compatible, handles encoding, shallow updates |
| File type detection | Extension-based checking | `file-type` (magic bytes) | Extension can be spoofed, magic bytes are reliable |
| Search query caching | Custom in-memory cache | `@upstash/redis` | Distributed, TTL support, persists across serverless invocations |
| Search debouncing | Custom `setTimeout` | `use-debounce` | Proper cleanup, SSR-safe, configurable leading/trailing |

**Key insight:** The image pipeline and map clustering are deceptively complex problems. Image uploads alone involve compression, EXIF stripping, format conversion, thumbnail generation, signed URLs, sort ordering, and storage bucket RLS. Map clustering involves zoom-level calculations, cluster expansion, bounding box queries, and smooth animations. Both have well-tested library solutions.

## Common Pitfalls

### Pitfall 1: Materialized View Staleness
**What goes wrong:** Search results don't include recently created/updated listings because the materialized view hasn't been refreshed.
**Why it happens:** Materialized views are point-in-time snapshots. Without a refresh strategy, new listings are invisible.
**How to avoid:** Refresh the materialized view concurrently after listing create/update/delete operations. Use `REFRESH MATERIALIZED VIEW CONCURRENTLY search_listings;` (requires a unique index). For MVP, trigger refresh in the API route handler after mutations. At scale, move to a cron job (every 5-15 minutes) via Supabase pg_cron or Edge Functions.
**Warning signs:** Users report "I just listed but can't find my property in search."

### Pitfall 2: PostGIS Coordinate Order (lng, lat not lat, lng)
**What goes wrong:** Map markers appear in the wrong location or geospatial queries return no results.
**Why it happens:** PostGIS and GeoJSON use `[longitude, latitude]` order, but most human-readable formats and APIs (including postcodes.io) return `latitude, longitude`.
**How to avoid:** Standardize on PostGIS convention internally: `ST_MakePoint(longitude, latitude)`. Convert from postcodes.io at the API boundary. Document the convention.
**Warning signs:** Properties in London appearing in the Atlantic Ocean (lat/lng swapped).

### Pitfall 3: Supabase Storage RLS for Property Images
**What goes wrong:** Users can upload to or delete from other users' listing media folders.
**Why it happens:** Supabase Storage RLS needs bucket policies separate from table RLS.
**How to avoid:** Create storage bucket policies that validate the upload path contains the user's ID or a listing ID they own. Use a folder structure like `property-images/{listing_id}/{hash}.webp` and verify listing ownership in the upload API route before uploading.
**Warning signs:** Users can overwrite or delete other agents' property photos.

### Pitfall 4: MapLibre CSS Not Loaded
**What goes wrong:** Map renders but controls/popups have no styling, or map container has zero height.
**Why it happens:** MapLibre GL JS requires its CSS file imported, and the map container needs explicit height.
**How to avoid:** Import `maplibre-gl/dist/maplibre-gl.css` in the map component. Set explicit height on the map container (e.g., `h-[600px]` or `h-screen`).
**Warning signs:** Map controls overlapping, popups unstyled, map container collapsed.

### Pitfall 5: Image Upload Size Limits
**What goes wrong:** Large image uploads fail silently or timeout.
**Why it happens:** Vercel/Next.js has a 4.5MB body size limit on API routes (serverless). Supabase Storage has its own limits.
**How to avoid:** Client-side compression to under 1MB before upload. For server processing, use streaming or signed upload URLs directly to Supabase Storage (bypassing the API route body limit). Set `maxDuration` on the API route if processing takes time.
**Warning signs:** Uploads work in dev but fail in production; timeout errors on large files.

### Pitfall 6: Search Performance Degradation Without Indexes
**What goes wrong:** Search becomes slow (>1s) as listing count grows.
**Why it happens:** Missing indexes on commonly filtered columns, or complex RLS subqueries executing per-row.
**How to avoid:** Create all indexes from the epic 2 schema (composite index on listing_type + status + price, GIST index on coordinates, GIN index on description_tsv and features). Use the materialized view to avoid RLS overhead on search queries (materialized views don't have RLS -- they're populated by the view definition).
**Warning signs:** P95 search latency exceeding 300ms at >5K listings.

### Pitfall 7: Polygon Search Without Bounding Box Pre-filter
**What goes wrong:** Drawing a polygon and searching takes 5+ seconds.
**Why it happens:** `ST_Within` polygon check runs on every row without a bounding box pre-filter.
**How to avoid:** Use `ST_Intersects(coordinates, ST_MakeEnvelope(...))` as a pre-filter with the polygon's bounding box (uses GIST index), then apply `ST_Within` on the filtered results.
**Warning signs:** Polygon search significantly slower than radius search.

## Code Examples

### Database Schema: Properties + Listings + Media
```sql
-- supabase/migrations/002_property_portal.sql

-- Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enums
CREATE TYPE property_type AS ENUM (
  'detached', 'semi_detached', 'terraced', 'flat', 'bungalow',
  'land', 'cottage', 'penthouse', 'studio', 'maisonette', 'other'
);
CREATE TYPE listing_type AS ENUM ('sale', 'rent');
CREATE TYPE listing_status AS ENUM (
  'draft', 'active', 'under_offer', 'sold', 'let', 'withdrawn', 'archived'
);
CREATE TYPE tenure_type AS ENUM ('freehold', 'leasehold', 'shared_ownership');
CREATE TYPE media_type AS ENUM ('image', 'floor_plan', 'epc_document');

-- Properties table (physical asset)
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  county TEXT,
  postcode TEXT NOT NULL,
  coordinates GEOGRAPHY(POINT, 4326),
  property_type property_type NOT NULL,
  bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0 AND bedrooms <= 50),
  bathrooms NUMERIC(3,1) NOT NULL CHECK (bathrooms >= 0),
  reception_rooms INTEGER CHECK (reception_rooms >= 0),
  square_footage INTEGER CHECK (square_footage > 0),
  title TEXT NOT NULL CHECK (LENGTH(title) <= 200),
  description TEXT NOT NULL CHECK (LENGTH(description) <= 5000),
  description_tsv TSVECTOR,
  features JSONB DEFAULT '{}'::jsonb,
  epc_rating CHAR(1) CHECK (epc_rating IN ('A','B','C','D','E','F','G')),
  epc_score INTEGER CHECK (epc_score BETWEEN 1 AND 100),
  tenure tenure_type,
  lease_remaining_years INTEGER CHECK (lease_remaining_years >= 0),
  council_tax_band CHAR(1) CHECK (council_tax_band IN ('A','B','C','D','E','F','G','H')),
  year_built INTEGER CHECK (year_built >= 1600 AND year_built <= 2050),
  new_build BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT valid_postcode CHECK (postcode ~ '^[A-Z]{1,2}[0-9R][0-9A-Z]?\s?[0-9][A-Z]{2}$')
);

-- Listings table (market offering)
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_type listing_type NOT NULL,
  status listing_status DEFAULT 'draft',
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  rent_frequency TEXT CHECK (rent_frequency IN ('weekly', 'monthly', 'yearly')),
  price_qualifier TEXT CHECK (price_qualifier IN ('offers_over', 'guide_price', 'fixed_price', 'from', 'poa')),
  service_charge_annual NUMERIC(10,2),
  ground_rent_annual NUMERIC(10,2),
  listed_date DATE DEFAULT CURRENT_DATE,
  available_from DATE,
  slug TEXT UNIQUE,
  view_count INTEGER DEFAULT 0,
  enquiry_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT valid_rent_freq CHECK (
    (listing_type = 'rent' AND rent_frequency IS NOT NULL) OR listing_type = 'sale'
  )
);

-- Property media
CREATE TABLE property_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  media_type media_type NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  file_size INTEGER,
  original_filename TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price history
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  old_price NUMERIC(12,2) NOT NULL,
  new_price NUMERIC(12,2) NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id)
);

-- Saved properties (shortlist)
CREATE TABLE saved_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- Saved searches
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  alerts_enabled BOOLEAN DEFAULT TRUE,
  alert_frequency TEXT DEFAULT 'daily' CHECK (alert_frequency IN ('instant', 'daily', 'weekly')),
  last_alerted_at TIMESTAMPTZ,
  new_results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search analytics
CREATE TABLE search_analytics (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  filters JSONB NOT NULL,
  result_count INTEGER NOT NULL,
  query_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Viewing history
CREATE TABLE viewing_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);
```

### Supabase Storage Bucket Configuration
```typescript
// API route or migration: Create storage buckets
// property-images: Public bucket (read), RLS on write
// property-documents: Private bucket (signed URLs for read/write)

// Upload flow:
// 1. Client compresses image via browser-image-compression
// 2. Client sends to /api/listings/[id]/media
// 3. Server validates ownership, file type, processes with sharp
// 4. Server uploads to Supabase Storage
// 5. Server creates property_media record
```

### TanStack Query Provider + Prefetching
```typescript
// app/(main)/search/page.tsx - Server Component with prefetch
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { searchProperties } from "@/services/search/search-service";
import { SearchPage } from "@/components/search/SearchPage";

export default async function Search({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["search", params],
    queryFn: () => searchProperties(params),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SearchPage />
    </HydrationBoundary>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Leaflet with DOM markers | MapLibre GL JS with WebGL rendering | 2023-2024 | 10x faster rendering, vector tiles, smooth zoom |
| `react-map-gl` with MapLibre | `@vis.gl/react-maplibre` (dedicated fork) | 2024-2025 | Simpler API, dedicated MapLibre support |
| `mapbox-gl-draw` for polygons | `terra-draw` with MapLibre adapter | 2024-2025 | Actively maintained, multiple drawing modes |
| Server-side image compression | Client-side + server-side pipeline | 2023+ | 80% bandwidth reduction before upload |
| Offset pagination (`LIMIT X OFFSET Y`) | Cursor-based keyset pagination | Best practice | O(1) vs O(n) at scale, no page drift |
| `react-map-gl/maplibre` | `@vis.gl/react-maplibre` | 2024 | Dedicated package, no Mapbox code bundled |
| Custom Elasticsearch/Algolia | PostgreSQL FTS + PostGIS | For MVP scale | Zero cost, no sync, excellent geospatial |

**Deprecated/outdated:**
- `mapbox-gl-draw`: No longer actively maintained. Use `terra-draw` instead.
- `react-map-gl` for MapLibre: Still works but `@vis.gl/react-maplibre` is the recommended replacement.
- Leaflet for property portals: MapLibre GL JS with WebGL provides significantly better performance for large datasets.
- Offset-based pagination for search: Cursor-based pagination is the standard for performance at scale.

## Open Questions

1. **Materialized View Refresh Strategy**
   - What we know: `REFRESH MATERIALIZED VIEW CONCURRENTLY` requires a unique index and doesn't lock reads during refresh. Supabase supports pg_cron for scheduling.
   - What's unclear: Whether pg_cron is available on Supabase Free tier, or if we need to use Supabase Edge Functions with a cron trigger instead.
   - Recommendation: Start with manual refresh after listing mutations in the API route. Add pg_cron or Edge Function cron as listings grow.

2. **Saved Search Alert Implementation**
   - What we know: Need to compare saved search criteria against new listings and notify users. Can use Supabase Edge Functions on a cron schedule.
   - What's unclear: Best approach for "instant" alerts without polling -- Supabase Realtime could trigger on listing inserts, but matching against saved searches in realtime is complex.
   - Recommendation: Implement daily/weekly alerts first via Edge Function cron. Defer "instant" to later phase or implement as "within 15 minutes" via frequent cron.

3. **MapTiler Free Tier Limits**
   - What we know: MapTiler free tier includes 100K map loads/month. UK-only portal may fit within this.
   - What's unclear: Exact definition of "map load" (initial load? tile requests?).
   - Recommendation: Monitor usage. Cache map tiles via service worker in the PWA phase (Phase 7). If limits are hit, MapTiler paid plans are affordable ($25/mo for 500K loads).

4. **Image Upload via Direct Supabase Storage vs API Route**
   - What we know: Direct Supabase Storage upload avoids the 4.5MB Vercel body limit. But server-side processing (EXIF strip, thumbnail gen) requires the API route approach.
   - What's unclear: Whether to use a two-step flow (upload raw to temp bucket, process via Edge Function, move to final bucket) or single-step via API route with streaming.
   - Recommendation: Use API route with client-side compression (keeps files under 1MB). If larger files needed, switch to signed upload URL + Edge Function processing.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + React Testing Library (from Phase 1 setup) |
| Config file | `vitest.config.mts` (created in Phase 1) |
| Quick run command | `pnpm test --run` |
| Full suite command | `pnpm test --run --coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SRCH-01 | Location search returns results by postcode/area | integration | `pnpm test src/__tests__/search/location-search.test.ts` | No -- Wave 0 |
| SRCH-02 | Filters narrow results (type, price, beds, baths) | unit | `pnpm test src/__tests__/search/filters.test.ts` | No -- Wave 0 |
| SRCH-03 | Advanced filters (amenities, EPC, new build) | unit | `pnpm test src/__tests__/search/advanced-filters.test.ts` | No -- Wave 0 |
| SRCH-04 | Map renders with property pins | unit | `pnpm test src/__tests__/map/property-map.test.ts` | No -- Wave 0 |
| SRCH-05 | Markers cluster at zoom levels | unit | `pnpm test src/__tests__/map/clustering.test.ts` | No -- Wave 0 |
| SRCH-06 | Polygon draw triggers spatial search | integration | `pnpm test src/__tests__/map/polygon-search.test.ts` | No -- Wave 0 |
| SRCH-07 | Save/unsave property to shortlist | unit | `pnpm test src/__tests__/saved/saved-properties.test.ts` | No -- Wave 0 |
| SRCH-08 | Save search criteria with alert prefs | unit | `pnpm test src/__tests__/saved/saved-searches.test.ts` | No -- Wave 0 |
| SRCH-09 | Alert triggers for new matching properties | integration | `pnpm test src/__tests__/alerts/search-alerts.test.ts` | No -- Wave 0 |
| SRCH-10 | Sort by price, date, relevance | unit | `pnpm test src/__tests__/search/sorting.test.ts` | No -- Wave 0 |
| SRCH-11 | Cursor-based pagination works correctly | unit | `pnpm test src/__tests__/search/pagination.test.ts` | No -- Wave 0 |
| SRCH-12 | Postcodes.io geocoding returns lat/lng | unit | `pnpm test src/__tests__/search/geocode.test.ts` | No -- Wave 0 |
| LIST-01 | Create listing with full property details | integration | `pnpm test src/__tests__/listings/create.test.ts` | No -- Wave 0 |
| LIST-02 | Upload photos with client compression | unit | `pnpm test src/__tests__/listings/image-upload.test.ts` | No -- Wave 0 |
| LIST-03 | Upload floor plans and documents | unit | `pnpm test src/__tests__/listings/document-upload.test.ts` | No -- Wave 0 |
| LIST-04 | Set pricing with qualifiers | unit | `pnpm test src/__tests__/listings/pricing.test.ts` | No -- Wave 0 |
| LIST-05 | Edit and update live listing | integration | `pnpm test src/__tests__/listings/update.test.ts` | No -- Wave 0 |
| LIST-06 | View listing analytics | unit | `pnpm test src/__tests__/listings/analytics.test.ts` | No -- Wave 0 |
| LIST-07 | Price history tracked on price change | unit | `pnpm test src/__tests__/listings/price-history.test.ts` | No -- Wave 0 |
| LIST-08 | PostGIS geospatial queries work | integration | `pnpm test src/__tests__/search/geospatial.test.ts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test --run` (quick, affected tests only)
- **Per wave merge:** `pnpm test --run --coverage`
- **Phase gate:** Full suite green + `pnpm build` + `pnpm lint` before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/mocks/supabase-storage.ts` -- Mock for Supabase Storage operations
- [ ] `src/__tests__/mocks/maplibre.ts` -- Mock for MapLibre GL JS (WebGL not available in test env)
- [ ] `src/__tests__/mocks/postcodes-io.ts` -- Mock for postcodes.io API responses
- [ ] `src/__tests__/fixtures/search-results.ts` -- Sample search result data
- [ ] `src/__tests__/fixtures/listings.ts` -- Sample listing data for tests

## Sources

### Primary (HIGH confidence)
- [MapLibre GL JS docs](https://maplibre.org/maplibre-gl-js/docs/) -- Map rendering, clustering, layers
- [@vis.gl/react-maplibre](https://visgl.github.io/react-maplibre/) -- React wrapper for MapLibre (v8.1.0)
- [maplibre-gl npm](https://www.npmjs.com/package/maplibre-gl) -- v5.19.0 (published Feb 2026)
- [Supabase PostGIS docs](https://supabase.com/docs/guides/database/extensions/postgis) -- Geo queries, extension setup
- [Supabase Storage docs](https://supabase.com/docs/guides/storage/buckets/fundamentals) -- Bucket config, RLS, signed URLs
- [postcodes.io API docs](https://postcodes.io/docs/api/) -- UK postcode geocoding, bulk lookup, autocomplete
- [browser-image-compression npm](https://www.npmjs.com/package/browser-image-compression) -- Client-side compression
- [sharp npm](https://www.npmjs.com/package/sharp) -- v0.34.5, server-side image processing
- [TanStack Query + Supabase + Next.js guide](https://supabase.com/blog/react-query-nextjs-app-router-cache-helpers) -- Server prefetching pattern

### Secondary (MEDIUM confidence)
- [terra-draw for MapLibre](https://terradraw.water-gis.com/) -- Polygon drawing plugin (newer, less established)
- [supercluster npm](https://www.npmjs.com/package/supercluster) -- Marker clustering algorithm
- [MapTiler style URLs](https://docs.maptiler.com/guides/maps-apis/maps-platform/how-to-use-maplibre/) -- Map style configuration
- Epic 2 spec (`docs/claude epic 2.txt`) -- Detailed schema, search architecture, security analysis

### Tertiary (LOW confidence)
- Epic 2 spec performance benchmarks -- Projected numbers, not measured on actual Supabase instance
- MapTiler free tier limits -- Need verification on exact "map load" definition
- terra-draw version stability -- Relatively new library, API may evolve

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified via npm with recent versions, well-established ecosystem
- Architecture: HIGH -- patterns from official docs (Supabase, MapLibre, postcodes.io), adapted from Epic 2 spec
- Database schema: HIGH -- based on Epic 2 spec production-grade schema with PostGIS, FTS, materialized views
- Pitfalls: HIGH -- identified from Epic 2 spec analysis, known PostGIS/MapLibre gotchas, Vercel body limits
- Image pipeline: MEDIUM -- approach is sound but exact flow (API route vs signed URL + Edge Function) needs validation during implementation
- Map interactions: MEDIUM -- MapLibre clustering well-documented, but terra-draw for polygon search is newer

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (30 days -- MapLibre and Supabase are stable, terra-draw may have updates)
