import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Search, MapPin } from "lucide-react";

export default function PropertyNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-lg space-y-8 rounded-2xl border border-brand-primary/10 bg-white p-8 shadow-sm">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-brand-primary/10">
            <MapPin className="size-8 text-brand-primary" aria-hidden="true" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-3 text-center">
          <h1 className="font-heading text-2xl font-bold text-neutral-900">
            Property Not Found
          </h1>
          <p className="text-neutral-600">
            This property may have been removed or the link may be incorrect. Try searching for similar properties in the area.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            asChild
            size="lg"
            className="w-full bg-brand-primary text-white hover:bg-brand-primary/90"
          >
            <Link href="/search">
              <Search className="mr-2 size-5" aria-hidden="true" />
              Search Properties
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full"
          >
            <Link href="/">
              <Home className="mr-2 size-5" aria-hidden="true" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
