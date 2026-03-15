import Link from "next/link";
import { HeroGallery } from "./HeroGallery";
import type { GalleryImage } from "./HeroGallery";

type PropertyDetailHeroProps = Readonly<{
  images: GalleryImage[];
  propertyTitle: string;
  address: string;
  city: string;
  postcode: string;
}>;

export function PropertyDetailHero({
  images,
  propertyTitle,
  address,
  city,
  postcode,
}: PropertyDetailHeroProps) {
  return (
    <div>
      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap mb-3 pt-4 px-4 lg:px-0"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/search?location=${encodeURIComponent(city)}`}
          className="hover:text-foreground transition-colors"
        >
          {city}
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/search?location=${encodeURIComponent(postcode)}`}
          className="hover:text-foreground transition-colors"
        >
          {postcode}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground truncate max-w-[200px]" aria-current="page">
          {address}
        </span>
      </nav>

      {/* Gallery — client component */}
      <HeroGallery images={images} propertyTitle={propertyTitle} />
    </div>
  );
}
