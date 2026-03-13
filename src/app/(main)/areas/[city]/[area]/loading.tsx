export default function AreaPageLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-64 animate-pulse bg-primary/5 rounded" />

      {/* Split hero skeleton */}
      <div className="grid lg:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="h-6 w-24 animate-pulse bg-primary/5 rounded-full" />
          <div className="h-14 w-3/4 animate-pulse bg-primary/5 rounded-xl" />
          <div className="h-4 w-full animate-pulse bg-primary/5 rounded" />
          <div className="h-4 w-5/6 animate-pulse bg-primary/5 rounded" />
          <div className="flex gap-4 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 w-36 animate-pulse bg-primary/5 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="h-[400px] animate-pulse bg-primary/5 rounded-2xl" />
      </div>

      {/* Tab bar skeleton */}
      <div className="flex gap-8 border-b border-neutral-200 pb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-4 w-20 animate-pulse bg-primary/5 rounded" />
        ))}
      </div>

      {/* Card grid skeleton */}
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse bg-primary/5 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
