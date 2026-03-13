export default function CityAreaGuideLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <div className="min-h-[70vh] animate-pulse bg-primary/5 rounded-b-2xl" />

      {/* Stats cards skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-primary/10 p-6 space-y-3">
              <div className="h-3 w-24 animate-pulse bg-primary/5 rounded-xl" />
              <div className="h-8 w-32 animate-pulse bg-primary/5 rounded-xl" />
              <div className="h-3 w-20 animate-pulse bg-primary/5 rounded-xl" />
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 pb-24">
        {/* Chart skeleton */}
        <div className="h-64 animate-pulse bg-primary/5 rounded-xl" />

        {/* Borough cards skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-primary/10 p-4 space-y-2">
              <div className="h-24 animate-pulse bg-primary/5 rounded-lg" />
              <div className="h-4 w-20 animate-pulse bg-primary/5 rounded" />
              <div className="h-3 w-14 animate-pulse bg-primary/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
