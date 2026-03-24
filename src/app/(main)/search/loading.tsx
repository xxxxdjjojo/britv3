export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-8">
      <div className="h-10 w-64 rounded-lg bg-neutral-200" />
      <div className="mt-4 h-12 w-full rounded-lg bg-neutral-100" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-72 rounded-xl bg-neutral-100" />
        ))}
      </div>
    </div>
  );
}
