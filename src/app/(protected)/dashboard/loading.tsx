export default function DashboardLoading() {
  return (
    <div className="animate-pulse p-6">
      <div className="h-8 w-48 rounded bg-neutral-200" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-neutral-100" />
        ))}
      </div>
      <div className="mt-8 h-64 rounded-xl bg-neutral-100" />
    </div>
  );
}
