export default function SoldPricesSlugLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero card skeleton */}
          <div className="rounded-xl bg-white border border-primary/10 overflow-hidden">
            <div className="aspect-video animate-pulse bg-primary/5" />
            <div className="p-8 space-y-6">
              <div className="h-8 w-2/3 animate-pulse bg-primary/5 rounded-xl" />
              <div className="h-4 w-1/3 animate-pulse bg-primary/5 rounded" />
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 animate-pulse bg-primary/5 rounded-xl" />
                ))}
              </div>
            </div>
          </div>

          {/* Price history skeleton */}
          <div className="rounded-xl bg-white border border-primary/10 p-8 space-y-6">
            <div className="h-6 w-32 animate-pulse bg-primary/5 rounded" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="pl-10 flex justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-24 animate-pulse bg-primary/5 rounded" />
                  <div className="h-3 w-16 animate-pulse bg-primary/5 rounded" />
                </div>
                <div className="h-5 w-12 animate-pulse bg-primary/5 rounded-full" />
              </div>
            ))}
          </div>

          {/* Table skeleton */}
          <div className="rounded-xl bg-white border border-primary/10 p-8 space-y-4">
            <div className="h-6 w-40 animate-pulse bg-primary/5 rounded" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 animate-pulse bg-primary/5 rounded" />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="h-80 animate-pulse bg-primary/5 rounded-xl" />
          <div className="h-56 animate-pulse bg-primary/5 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
